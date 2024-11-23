{
  name ? "",
  yarn2nix-moretea,
  stdenv,
  inputs,
  nodejs-slim_22,
}:
let
  inherit (inputs) nix-filter;
in
yarn2nix-moretea.mkYarnPackage {
  inherit name;
  src = nix-filter.lib {
    root = ../.;
    exclude = [
      ../dist
      ../node_modules
    ];
  };
  dontFixup = true;
  doDist = false;
  yarnLock = ../yarn.lock;
  packageJSON = ../package.json;
  buildPhase = ''
    # yarn tries to create a .yarn file in $HOME. There's probably a
    # better way to fix this but setting HOME to TMPDIR works for now.
    export HOME="$TMPDIR"
    yarn build
  '';
  installPhase = ''
    mkdir -p $out/bin
    cp -r node_modules $out/bin/node_modules
    mv deps/feed-generator/dist $out/bin
    mv deps/feed-generator/package.json $out/bin
    cat <<ENTRYPOINT > $out/bin/entrypoint
    #!${stdenv.shell}
    ${nodejs-slim_22}/bin/node $out/bin/dist/index.js
    ENTRYPOINT
    chmod +x $out/bin/entrypoint
  '';
  meta.mainProgram = "entrypoint";
}
