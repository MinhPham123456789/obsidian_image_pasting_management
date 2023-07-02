import { Editor, Plugin, TFile , MarkdownView } from "obsidian";
import fs from "fs";

export default class ExamplePlugin extends Plugin {
  async onload() {
    this.registerEvent(
			this.app.vault.on('create', (file) => {
				// debugLog('file created', file)
				if (!(file instanceof TFile))
					return
				const timeGapMs = (new Date().getTime()) - file.stat.ctime
				// if the file is created more than 1 second ago, the event is most likely be fired on vault initialization when starting Obsidian app, ignore it
				if (timeGapMs > 1000)
					return
				// always ignore markdown file creation
				if (isMarkdownFile(file))
					return
				if (isImage(file)) {
					// console.log(file)
					this.startImagePastingManagementProcess(file)
				} else {
					if (this.settings.handleAllAttachments) {
						// debugLog('handleAllAttachments for file', file)
						if (this.testExcludeExtension(file)) {
							// debugLog('excluded file by ext', file)
							return
						}
						this.startImagePastingManagementProcess(file)
					}
				}
			})
		)
  }

	async startImagePastingManagementProcess(file: TFile) {
		// get active file first
		const activeFile = this.app.workspace.getActiveFile()
		if (!activeFile) {
			new Notice('Error: No active file found.')
			return
		}
		
		// get the vault full path, may not need to be this detailed
		var vaultAbsPath = this.app.vault.adapter.basePath

		// get the current active note path starting at vault
		var activeFilePath = activeFile.parent.path
		if (activeFilePath === "/"){
			activeFilePath = ""
		}
		
		// create new directory based on note name
		var noteImageDir = activeFile.name.trim().replace(".md", "").replace(/\s+/g, "_") + "_images"
		var absNoteImageDir = vaultAbsPath + "/" + activeFilePath + "/" + noteImageDir
		if (!fs.existsSync(absNoteImageDir)){
			fs.mkdirSync(absNoteImageDir, 484)
		}

		var relativeNoteImagePath = activeFilePath + "/" + noteImageDir		

		// get image auto generated name
		var fileName = file.basename + "_" + Date.now().toString(36) + "." + file.extension

		this.saveFile(file, fileName, activeFilePath, relativeNoteImagePath)
	}

	async saveFile(file: TFile, inputNewName: string, sourcePath: string, imagePath: string) {
		// deduplicate name
		// const { name:newName } = await this.deduplicateNewName(inputNewName, file)
		// debugLog('deduplicated newName:', newName)
		// const originName = file.name

		// generate linkText using Obsidian API, linkText is either  ![](filename.png) or ![[filename.png]] according to the "Use [[Wikilinks]]" setting.
		const linkText = this.app.fileManager.generateMarkdownLink(file, sourcePath)
		

		// file system operation: rename the file
		const oldPath = sourcePath + "/" + inputNewName
		const newPath = imagePath + "/" + inputNewName
		// console.log(newPath)

		// Put the image to the Obsidian's setting directory
		try {
			await this.app.fileManager.renameFile(file, oldPath)
		} catch (err) {
			new Notice(`Error: ${err}`)
			throw err
		}

		// Then move the image to the new directory, avoid triggering error in Obsidian's app.js and broken image when initiating directory in 1st pasting
		try {
			await this.app.fileManager.renameFile(file, newPath)
		} catch (err) {
			new Notice(`Error: ${err}`)
			throw err
		}

		// Update the markdown link in the note
		const newLinkText = this.app.fileManager.generateMarkdownLink(file, imagePath)
		const view = this.app.workspace.getActiveFileView(MarkdownView)
		if (view){
			const cursor = view.editor.getCursor()
			const line = view.editor.getLine(cursor.line)
			const replacedLine = line.replace(linkText, newLinkText)
			// debugLog('current line -> replaced line', line, replacedLine)
			// console.log('editor context', cursor, )
			view.editor.transaction({
				changes: [
					{
						from: {...cursor, ch: 0},
						to: {...cursor, ch: line.length},
						text: replacedLine,
					}
				]
			})
		}
		else{
			new Notice(`Failed to rename ${newName}: no active editor`)
			return
		}
	
	}
}

function isMarkdownFile(file: TAbstractFile): boolean {
	if (file instanceof TFile) {
		if (file.extension === 'md') {
			return true
		}
	}
	return false
}

const IMAGE_EXTS = [
	'jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg',
]

function isImage(file: TAbstractFile): boolean {
	if (file instanceof TFile) {
		if (IMAGE_EXTS.contains(file.extension.toLowerCase())) {
			return true
		}
	}
	return false
}


