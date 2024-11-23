{
  inputs,
  app,
}:
let
  inherit (inputs.jacobi.packages.x86_64-linux.foundry) foundry_v2;
in
foundry_v2 {
  name = "ttrpg-feed";
  registry = "ghcr.io/wuz";
  author = "c@wuz.sh";
  enableNix = false;
  sysLayer = false;
  layers = [ [ app ] ];
  extraConfig = {
    Cmd = [ "/bin/entrypoint" ];
  };
}
