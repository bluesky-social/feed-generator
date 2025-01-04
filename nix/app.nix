{
  name ? "",
  stdenv,
  inputs,
  nodejs-slim_22,
  callPackage,
  python3,
}:
let
  inherit (inputs) nix-filter;
  project =
    callPackage ../yarn-project.nix
      {

        nodejs = nodejs-slim_22;
      }
      {

        src = nix-filter.lib {
          root = ../.;
          exclude = [
            ../dist
            ../node_modules
          ];
        };

      };
in
project.overrideAttrs (oldAttrs: {
  inherit name;
  dontFixup = true;
  buildInputs = oldAttrs.buildInputs ++ [ python3 ];

  buildPhase = ''
    # yarn tries to create a .yarn file in $HOME. There's probably a
    # better way to fix this but setting HOME to TMPDIR works for now.
    export HOME="$TMPDIR"
    yarn build
  '';
  installPhase = ''
    mkdir -p $out/bin
    cp -r node_modules $out/bin/node_modules
    mv dist $out/bin
    mv package.json $out/bin
    cat <<ENTRYPOINT > $out/bin/entrypoint
    #!${stdenv.shell}
    ${nodejs-slim_22}/bin/node $out/bin/dist/index.js
    ENTRYPOINT
    chmod +x $out/bin/entrypoint
  '';
  meta.mainProgram = "entrypoint";
})
