{ pkgs, ags }:
pkgs.stdenv.mkDerivation {
  pname = "ags-nm-panel";
  version = "0.1.0";
  src = ./.;
  nativeBuildInputs = [ pkgs.wrapGAppsHook3 pkgs.gobject-introspection ags.default ];
  buildInputs = [ ags.io ags.astal4 pkgs.gjs pkgs.networkmanager ];
  installPhase = ''
    mkdir -p $out/bin
    ags bundle app.ts $out/bin/ags-nm-panel
  '';
  meta = {
    description = "Standalone NetworkManager panel built with AGS";
    license = pkgs.lib.licenses.wtfpl;
    mainProgram = "ags-nm-panel";
    platforms = pkgs.lib.platforms.linux;
  };
}
