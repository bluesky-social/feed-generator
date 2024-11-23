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
              skopeo
              ;
          };

          devShells.default = pkgs.mkShell {
            packages = with pkgs; [
              corepack_22
              nodejs_22
              nodePackages.typescript
              nodePackages.typescript-language-server
            ];
          };
        };
    };
}
