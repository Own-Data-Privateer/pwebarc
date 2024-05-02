{ pkgs ? import <nixpkgs> {}
, debug ? false
}:

let packages = import ./packages.nix { inherit pkgs debug; }; in

pkgs.buildEnv {
  name = "pwebarc-20240502";
  paths = with packages; [
    dumb_server
    extension
    tool
  ];
}
