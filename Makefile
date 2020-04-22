# Make file for preparing TerrainDemo
all:output
	echo "Project Directory Generated in out/."
#TODO: only copy files that are needed, rather than whole directory
output: manifest
	rm -r out/*; mv manifest.auto out/; \
	             cp -r assets/models/ out/; \
	             cp -r assets/scripts/ out/; \
	             cp -r assets/shaders/ out/; \
	             cp -r assets/textures/ out/; 
	
manifest:
	../rastjs/genmanifest.js

