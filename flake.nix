{
  description = "Standalone NetworkManager panel built with AGS";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";
    ags = {
      url = "github:aylur/ags/v3.1.2";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  outputs = { self, nixpkgs, ags }: let
    system = "x86_64-linux";
    pkgs = nixpkgs.legacyPackages.${system};
    astal = ags.packages.${system};
  in {
    packages.${system}.default = pkgs.stdenv.mkDerivation {
      pname = "ags-nm-panel";
      version = "0.1.0";
      src = ./.;
      nativeBuildInputs = [ pkgs.wrapGAppsHook3 pkgs.gobject-introspection astal.default ];
      buildInputs = [ astal.io astal.astal4 pkgs.gjs pkgs.networkmanager ];
      installPhase = ''
        mkdir -p $out/bin $out/share
        cp -r icons $out/share/icons
        cp connection-info.sh $out/bin/ags-nm-panel-info
        ags bundle app.ts $out/bin/ags-nm-panel
      '';
      preFixup = ''
        gappsWrapperArgs+=(
          --prefix XDG_DATA_DIRS : "$out/share"
          --prefix PATH : "$out/bin:${pkgs.lib.makeBinPath [ pkgs.networkmanagerapplet pkgs.jq pkgs.systemd pkgs.procps ]}"
        )
      '';
      meta = {
        description = "Standalone NetworkManager panel built with AGS";
        license = pkgs.lib.licenses.wtfpl;
        mainProgram = "ags-nm-panel";
      };
    };
  };
}
