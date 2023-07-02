# Obsidian Image Pasting Management Plugin

This plugin is based on the repository https://github.com/reorx/obsidian-paste-image-rename.git


## Plugin Description
When pasting image into obsidian note:
1. A new directory is created in the same directory with the current in used note and the directory's name is the note's name (replace spaces with _) concatenate with "_images"
2. The pasted image's name will be concatenated with a unique ID to avoid duplicate
3. The pasted image will be stored in the new directory
4. The pasted image's markdown link will display the image's concatenated name

## Installation
```bash
git clone https://github.com/MinhPham123456789/obsidian_image_pasting_management
cd [repository directory]
npm install
npm run dev
```
When the terminal says (Build finished) just press Ctrl + C

Copy the main.ts manifest.json to vault/.obisidian/plugins/obsidian_image_pasting_management/
