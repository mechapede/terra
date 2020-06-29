# Make file for preparing TerrainDemo
# TODO: only copy files that are needed in manifest, rather than whole directory
all:output
	echo "Project Directory Generated in out/."

output: manifest
	rm -r out/*; mv manifest.auto out/; \
	             cp -r assets/models/ out/; \
	             cp -r assets/scripts/ out/; \
	             cp -r assets/shaders/ out/; \
	             cp -r assets/textures/ out/; 
	
manifest:
	../rastjs/genmanifest.js

