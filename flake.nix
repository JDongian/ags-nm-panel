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
  in {
    packages.${system}.default = import ./. {
      inherit pkgs;
      ags = ags.packages.${system};
    };

    devShells.${system}.default = pkgs.mkShell {
      packages = [
        (ags.packages.${system}.default.override {
          extraPackages = [ pkgs.networkmanager ];
        })
      ];
    };
  };
}
