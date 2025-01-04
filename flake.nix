{
  nixConfig = {
    extra-substituters = [ "https://wuz.cachix.org" ];
    extra-trusted-public-keys = [
      "wuz.cachix.org-1:cvFztsdv6usx0iXXs9tbskFTxaozacGaE4WG1uW6W1M="
    ];
  };
  description = "A feed for bluesky";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    nix-filter.url = "github:numtide/nix-filter";
    jacobi.url = "github:jpetrucciani/nix";
  };

  outputs =
    inputs@{
      self,
      nixpkgs,
      flake-parts,
      systems,
      ...
    }:
    let
      name = "ttrpg-feed";
    in
    flake-parts.lib.mkFlake { inherit inputs; } {
      systems = import systems;
      flake = {
        overlays.default = self: super: rec {
          app = self.callPackage ./nix/app.nix { inherit inputs name; };
          image = self.callPackage ./nix/docker.nix { inherit inputs app; };
        };
      };
      perSystem =
        {
          pkgs,
          system,
          ...
        }:
        {
          _module.args.pkgs = import nixpkgs {
            inherit system;
            config.allowUnfree = true;
            overlays = [ self.overlays.default ];
          };

          packages = {
            inherit (pkgs)
              app
              image
              ;
          };

          devShells.default = pkgs.mkShell {
            packages = with pkgs; [
              corepack_22
              nodejs_22
              nodePackages.typescript
              nodePackages.typescript-language-server
              (postgresql_17.withPackages (p: [ p.postgis ]))
            ];
            postgresConf = pkgs.writeText "postgresql.conf" ''
              # Add Custom Settings
              log_min_messages = warning
              log_min_error_statement = error
              log_min_duration_statement = 100  # ms
              log_connections = on
              log_disconnections = on
              log_duration = on
              #log_line_prefix = '[] '
              log_timezone = 'UTC'
              log_statement = 'all'
              log_directory = 'pg_log'
              log_filename = 'postgresql-%Y-%m-%d_%H%M%S.log'
              logging_collector = on
              log_min_error_statement = error
            '';

            # ENV Variables
            PGDATA = ".pg";
            PG_DATABASE = "postgres";
            PG_USER = "postgres";
            PG_PASS = "";
            PG_HOST = "127.0.0.1";

            # Post Shell Hook
            shellHook = ''
              # Setup: other env variables
              export PGHOST="$PGDATA"
              # Setup: DB
              [ ! -d $PGDATA ] && pg_ctl initdb -o "-U postgres" && cat "$postgresConf" >> $PGDATA/postgresql.conf
              alias pg="psql -U $PG_USER"
            '';
          };
        };
    };
}
