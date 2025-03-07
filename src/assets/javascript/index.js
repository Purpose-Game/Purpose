/* global SimpleNotification, GamePad, AudioLibrary, AudioSystem, Drift */

//
// Variables
//

// Game Version
const version = "2.0.0";
// Keys that progress the story
const progressKeys = [ 13, 17, 32, 38, 39, 40 ];
// Body Element
const body = $("body");
// Tags to treat as story passages
const storyTags = [ "page", "variation", "redirect", "addition" ]
// Custom HTML Tags
const customTags = "ui, character, resetcharacter, characteroverride, special, action, speech, sound, music, stopmusic, killmusic, flashback, choices, rumble, wait, clearwait";
// Save Options UI
const saveOptions = `
<div class="menu-options">
	<div class="option-one"><img id="option-one" href="javascript:void(0)" class="sound-click" onclick="window.story.saveGame(true)"></div>
	<div class="option-two"><img id="option-two" href="javascript:void(0)" class="sound-click" onclick="window.story.pauseMenu()"></div>
</div>
`;
// UI Styles
const uiStyles = {
	// Standard UI
	standard: `
		<div class="container">

			${saveOptions}

			<div class="character-left">
				<img id="character-one-image" class="character-slot">
			</div>

			<div class="character-right">
				<img id="character-two-image" class="character-slot">
			</div>

			<div class="text-area">
				<div class="character-name character-name-left">
					<img class="character-name">
					<div id="character-one"></div>
				</div>

				<div class="character-name character-name-right">
					<img class="character-name">
					<div id="character-two"></div>
				</div>

				<div class="text-area-main">
					<img>
				</div>
			</div>

		</div>
	`,

	// Special UI
	special: `
		<div class="container">

			${saveOptions}

			<div class="character-left">
				<img id="character-one-image" class="character-slot">
			</div>

			<div class="text-area">
				<div class="character-name character-name-left">
					<img class="character-name">
					<div id="character-one"></div>
				</div>

				<div class="text-area-special">
					<img>
				</div>
			</div>

			<div class="special-right">
				<img id="special-image" class="special-image">
			</div>

		</div>
	`,

	minimal: `
		<div class="container">

			<div class="text-area">
				<div class="text-area-minimal">
					<img>
				</div>
			</div>

		</div>
	`,
}

let debug = false;
let debugNotification;
let skipNotification;

let images;
let uiType;
let speaker;
let lastText;
let textArea;
let steps = [];
let inFlashback;
let originalImages;
let currentStep = 0;
let lastTextStep = 0;
let typewriting = [];
let maxChoiceIndex = 0;
let keybindSelectedElement;
let currentChoiceIndex = -1;

//
// Story Variables
//

window.story.version = version;

// Current Chapter, i.e. "Chapter1"
window.story.state.chapter = "";
window.story.state.choices = {};
window.story.state.achievements = {};

window.story.player = {};
window.story.player.name = "Player";
window.story.player.id = "0";
window.story.player.key = "0";

// If Cloud Saving is enabled
window.story.saving = false;
window.story.saveSlot = 1;
// If game is being played online
window.story.network = false;
// Is player making a choice
window.story.makingChoice = false;
// If a passage can be stepped through
window.story.stepable = false;

// Used for statistics passages, see "Choices" passage for all choices
//	"Choice Internal Name": [
//		You and X% of players:
//		"did some actions or made some choice",
//		You and X% of players:
//		"did some opposite actions or made some other choice"
//	],
window.story.choiceDescriptions = {
	"Chapter1": {
		"Lied": [
			"lied to Lucy about how you hurt your leg",
			"told Lucy the truth about how you hurt your leg"
		],
		"NewPurpose": [
			"told yourself you needed to find a new purpose in life",
			"told yourself you have no purpose in life and should die"
		],
		"Laughed": [
			"found the time to have a laugh",
			"did not find the time to have a laugh"
		],
		"Tiffany": [
			"called Tiffany by her full name",
			"called Tiffany by the nickname you made"
		],
		"Haircut": [
			"gave yourself a haircut",
			"passed up the opportunity for a haircut"
		],
		"WillHelp": [
			"told Lucy people will help Tiffany in her time of need",
			"told Lucy people will not help Tiffany in her time of need"
		],
		"Protect": [
			"chose to protected Tiffany",
			"chose to investigate the noise"
		],
		"SaveStranger": [
			"went outside to save the stranger",
			"stayed inside and tried to keep the stranger out"
		],
		"LucySavesStranger": [
			"influenced Lucy to save the stranger",
			"influenced Lucy to try and keep the stranger out"
		],
		"TriedToSaveLucy": [
			"tried to save Lucy, but let Tiffany watch her die",
			"did as Lucy asked, saving Tiffany from watching her die"
		],
		"StrangerDied": [
			"watched the stranger die",
			"left with the stranger"
		]
	}
};

// Used for achievements and end passages
//	"Achievement Internal Name": [
//		"Achievement Name", "Achievement Description"
//	],
window.story.achievementDescriptions = {
	"Chapter1": {
		"Knocked": [
			"Knock, knock", "Who's *there?*"
		],
		"Soap": [
			"Nothing wasted", "You never know when it will come in handy!"
		],
		"Filter": [
			"No Filter", "Speaking your mind, *even when you shouldn't.*"
		],
		"Nothing": [
			"Silent Treatment", "You have the right to remain silent..."
		],
		"NoChoice": [
			"Broken Record", "You need some new material."
		],
		"RollCredits": [
			"Roll Credits", "And that's a Sin."
		],
		"Drama": [
			"Drama Queen", "You should have been an actor."
		],
		"Walkers": [
			"Walkers?", "What do you call the ones that run?"
		],
		"Scorpion": [
			"Scorpion", "*Get over here*"
		]
	}
}

//
// Events
//

$(document).on("sm.passage.showing", (_, data) => {
	if (data.passage === undefined) return;

	const passage = data.passage;
	const twPassage = $("tw-passage");

	debugMessage(`Passage changed to "${passage.name}".`);

	// Set browser tab name, doesn't work when inside iFrame
	$(document).attr("title", "Purpose - " + passage.name);
	// Scroll to top of screen on passage change for mobile users
	window.scrollTo(0, 0);

	if (debug) {
		if (!debugNotification) {
			debugNotification = SimpleNotification.message({
				title: "Alpha Build"
			}, {
				position: "bottom-right",
				sticky: true,
				closeButton: false,
				closeOnClick: false
			});
		}

		debugNotification.setText(`Content subject to change!\nCurrent Passage: \`\`${passage.name}\`\``);
	}

	if (!passage.tags) return;

	if (passage.tags.includes("menu")) twPassage.hide(0).fadeIn(500);

	if (window.story.saving && passage.tags.includes("save")) {
		// TODO: Rework save system
		/* // Stop saving of the page we just loaded back into
		if (justSaved) {
			debugMessage(`Not saving ${passage.name} as justLoaded is ${true}`);
			return;
		}

		debugMessage(`Game saved at ${passage.name}`);

		window.story.state.lastPassage = passage.name;
		window.story.saveGame();*/
	}
});

$(document).on("sm.passage.shown", (_, data) => {
	const passage = data.passage;
	const twPassage = $("tw-passage");

	window.story.makingChoice = false;
	window.story.stepable = false;

	if (!passage.tags) return;

	if (passage.tags.some(tag => storyTags.includes(tag))) {
		const pageHTML = twPassage.html();
		// Replace %Tiffany% with what the player chose to call Tiffany
		if (pageHTML.includes("%Tiffany%")) twPassage.html(pageHTML.replaceAll("%Tiffany%", window.story.tiffany()));
console.log(twPassage.html());
		if (twPassage.length) processPassage(twPassage);
	}
});

body.mouseover((event) => {
	const element = $(event.target);

	if (!element.is("a") && !element.attr("class")?.includes("sound-")) return;

	if (keybindSelectedElement) {
		keybindSelectedElement.removeClass("hovered");
		keybindSelectedElement = null;
	}

	AudioSystem.playSound(AudioLibrary.ui.button);
});

body.click((event) => {
	const element = $(event.target);
	const elementClass = element.attr("class");

	if (!element.is("a") && !elementClass?.includes("sound-")) {
		const ignoreClick = ["option-one", "option-two"];

		if (!ignoreClick.includes(event.target.id)) stepPassage();
	} else {
		AudioSystem.playSound(elementClass === "sound-confirm" ? AudioLibrary.ui.confirm : AudioLibrary.ui.click);
	}
});

body.keyup((event) => {
	if (!skipNotification || event.keyCode !== 17) return;

	skipNotification.close();
	skipNotification = null;
});

body.keydown((event) => {
	if (!progressKeys.includes(event.keyCode)) return;

	if (window.story.stepable && !window.story.makingChoice) {
		if (event.keyCode === 17 && !skipNotification) {
			skipNotification = SimpleNotification.info({
				title: "Skipping..."
			}, {
				position: "top-left",
				sticky: true,
				closeButton: false,
				closeOnClick: false
			});
		}

		stepPassage();
		return;
	}

	// Skip key
	if (event.keyCode === 17) return;

	let oldChoiceIndex = currentChoiceIndex;

	if (currentChoiceIndex === -1 || !keybindSelectedElement) {
		currentChoiceIndex = 0;
	} else {
		$(`#choice-${currentChoiceIndex}`).removeClass("hovered");

		switch (event.keyCode) {
			// Enter
			case 13:
				$(`#choice-${currentChoiceIndex}`).trigger("click");
				return;

			// Up
			case 38:
				if (currentChoiceIndex > 0) --currentChoiceIndex;
				break;

			// Down
			case 40:
				if (currentChoiceIndex < maxChoiceIndex) currentChoiceIndex++;
				break;
		}
	}

	const currentElement = $(`#choice-${currentChoiceIndex}`);

	if (oldChoiceIndex != currentChoiceIndex) AudioSystem.playSound(AudioLibrary.ui.click);

	currentElement.addClass("hovered");

	keybindSelectedElement = currentElement;
});

//
// Helpers
//

// Prints a debug message to the console if in debug mode
const debugMessage = (message) => debug && console.log(`DEBUG: ${message}`);

// Delays execution for X ms
const sleep = ms => new Promise(r => setTimeout(r, ms));

const stepPassage = async () => {
	const storyBox = $(".story-box");
	const ui = uiType === "standard" ? "main" : uiType === "special" ? "special" : "minimal";

	if (typewriting.includes(lastTextStep)) {
		if (lastText) lastText.remove();

		const [type, content] = steps[lastTextStep];

		if (type === "SPEECH" && speaker && originalImages) {
			speaker.attr("class", "character-slot");
			speaker.css("background-image", originalImages.join(", "));
		}

		textArea.append(`
			<div ${inFlashback ? `class="italic" ` : ``}id="text-area-${ui}-${lastTextStep}-skipped">
				${type === "SPEECH" ? `"${content}"` : content}
			</div>
		`);

		lastText = $(`#text-area-${ui}-${lastTextStep}-skipped`);
		typewriting = typewriting.filter(i => i !== lastTextStep);

		debugMessage(`Skipped to end of passage ${lastTextStep}.`);
	} else if (steps[currentStep]) {
		const step = currentStep;

		let [type, content, extra] = steps[step];

		currentStep++;

		if (extra === "Tiff") extra = "Tiffany";
		if (content === "Tiff") content = "Tiffany";

		switch (type) {
			// Change the current UI layout
			case "UI":
				storyBox.empty();

				uiType = content.toLowerCase();

				switch (uiType) {
					case "standard":
						storyBox.append(uiStyles.standard);
						textArea = $(".text-area-main");
						break;

					case "special":
						storyBox.append(uiStyles.special);
						textArea = $(".text-area-special");
						break;

					case "minimal":
						storyBox.append(uiStyles.minimal);
						textArea = $(".text-area-minimal");
						break;
				}

				stepPassage();
				break;

			// Set a character to a slot
			case "CHARACTER": {
				const extras = extra.split(" ");
				const slot = extras.shift();
				const knownUnknown = content.startsWith("?");
				const character = knownUnknown ? "unknown" : content.toLowerCase();
				const mixer = document.createElement("span");

				mixer.id = "mixer-image";
				document.head.appendChild(mixer);

				const mixerImage = $(`#mixer-image`);
				const parent = $(`#character-${slot}`);
				const parentImage = $(`#character-${slot}-image`);

				let parts = [];
				let images = [];

				switch (extras.length) {
					case 0:
						parts = [
							`${character}-eyes-neutral`,
							`${character}-mouth-neutral`,
							`${character}-stance-neutral`
						];
						break;

					case 1:
						parts = [
							`${character}-eyes-${extras[0]}`,
							`${character}-mouth-${extras[0]}`,
							`${character}-stance-neutral`
						];
						break;

					case 2:
						switch (extras[1]) {
							case "ditto":
								parts = [
									`${character}-eyes-${extras[0]}`,
									`${character}-mouth-${extras[0]}`,
									`${character}-stance-${extras[0]}`
								];
								break;

							case "eyes":
								parts = [
									`${character}-eyes-${extras[0]}`,
									`${character}-mouth-neutral`,
									`${character}-stance-neutral`
								];
								break;

							case "mouth":
								parts = [
									`${character}-eyes-neutral`,
									`${character}-mouth-${extras[0]}`,
									`${character}-stance-neutral`
								];
								break;

							case "stance":
								parts = [
									`${character}-eyes-neutral`,
									`${character}-mouth-neutral`,
									`${character}-stance-${extras[0]}`
								];
								break;

							default:
								parts = [
									`${character}-eyes-${extras[0]}`,
									`${character}-mouth-${extras[1]}`,
									`${character}-stance-neutral`
								];
								break;
						}
						break;

					case 3:
						parts = [
							`${character}-eyes-${extras[0]}`,
							`${character}-mouth-${extras[1]}`,
							`${character}-stance-${extras[2]}`
						];
						break;
				}

				for (const part of parts) {
					mixerImage.attr("class", part);
					images.push(mixerImage.css("background-image"));
				}

				parent.text(knownUnknown ? content.substring(1) : content === "Unknown" ? "???" : content);
				parentImage.attr("class", "character-slot");
				parentImage.css("background-image", images.join(", "));
				mixerImage.remove();
				mixer.remove();

				stepPassage();
				break;
			}

			// Resets a character slot
			case "RESETCHARACTER": {
				const slot = extra?.replace("/", "")?.split(" ")?.shift();

				if (!slot) {
					alert("No slot provided to Reset Character!");
				} else {
					$(`#character-${slot}`).text("");
					$(`#character-${slot}-image`).css("background-image", "");
				}

				stepPassage();
				break;
			}

			// Override a character slot name by slot number
			case "CHARACTEROVERRIDE": {
				const slot = extra?.split(" ")?.shift();

				if (!slot) {
					alert("No slot provided to Character Override!");
				} else {
					$(`#character-${slot}`).text(content);
				}

				stepPassage();
				break;
			}

			// Set the image for the Special UI
			case "SPECIAL": {
				$("#special-image").attr("class", "special-image");
				$("#special-image").addClass(`${content.toLowerCase()}-image`);

				const imageURL = window.getComputedStyle(document.querySelector("#special-image")).getPropertyValue("background-image");

				$("#special-image").attr("data-zoom", imageURL.substring(imageURL.indexOf("\"") + 1, imageURL.lastIndexOf("\"")));

				new Drift(document.querySelector("#special-image"), {
					inlinePane: false,
					paneContainer: document.querySelector(".text-area")
				});

				stepPassage();
				break;
			}

			// Plays a sound effect
			case "SOUND":
				AudioSystem.playSound(AudioLibrary.sfx[content]);

				stepPassage();
				break;

			// Plays background music
			case "MUSIC":
				await AudioSystem.playMusic(AudioLibrary.music[content]);

				stepPassage();
				break;

			// Stops background music
			case "STOPMUSIC":
				stepPassage();

				await AudioSystem.stopMusic();
				break;

			// Kills background music
			case "KILLMUSIC":
				stepPassage();

				await AudioSystem.killMusic();
				break;

			// Sets passage as a flashback passage
			case "FLASHBACK":
				inFlashback = true;

				stepPassage();
				break;

			// Trigger gamepad rumble
			case "RUMBLE": {
				GamePad.gamepadRumble(...content.split(" "));

				stepPassage();
				break;
			}

			// Pause passage progression
			case "WAIT": {
				await sleep(content);

				stepPassage();
				break;
			}

			// Pause passage progression and clear text box
			case "CLEARWAIT": {
				lastText.html("");

				await sleep(content);

				stepPassage();
				break;
			}

			// Handles SPEECH, ACTION, and CHOICES
			default: {
				let character;
				let slotOverride;
				let specificSpeech = "";

				if (lastText) lastText.remove();

				if (extra?.includes(" ")) {
					const extras = extra.toLowerCase().split(" ");

					character = extras[0] ?? "";

					switch (extras.length) {
						case 2:
							if (extras[1].startsWith("!")) {
								slotOverride = extras[1].substring(1);
							} else {
								specificSpeech = `-${extras[1]}`;
							}
							break;

						case 3:
							slotOverride = extras[1].substring(1);
							specificSpeech = `-${extras[2]}`;
							break;
					}
				} else {
					character = extra?.toLowerCase() ?? "";
				}

				if (type !== "CHOICES") typewriting.push(step);

				textArea.append(`
					<div ${inFlashback ? `class="italic" ` : ``}id="text-area-${ui}-${step}"></div>
				`);

				lastTextStep = step;
				lastText = $(`#text-area-${ui}-${step}`);

				let characterOne = $("#character-one").text().toLowerCase();
				let characterTwo = $("#character-two").text().toLowerCase();

				if (characterOne === "???") characterOne = "unknown";
				if (characterTwo === "???") characterTwo = "unknown";

				if (!slotOverride) {
					$("#character-one-image").css("opacity", character !== characterOne ? "0.6" : "1");
					$("#character-two-image").css("opacity", character !== characterTwo ? "0.6" : "1");
				} else {
					$(`#character-${slotOverride}-image`).css("opacity", "1");
				}

				lastText.html(type === "SPEECH" ? `"${content}"` : content);

				if (type !== "CHOICES") {
					if (type === "SPEECH" && character) {
						speaker = $(`#character-${slotOverride ? slotOverride : character === characterOne ? "one" : "two"}-image`)

						let backgroundImages = speaker.css("background-image");

						if (
							// Not scared Tiffany has her mouth covered OR
							(character !== "Tiffany" && !backgroundImages.includes("stance/scared")) &&
							// Not Lucy has surgical mask on OR
							(character !== "Lucy" && !backgroundImages.includes("stance/neutral_mask")) &&
							// Not Unknown has no mouth
							(!backgroundImages.includes("unknown/neutral"))
						) {
							images = backgroundImages.split(", ");
							originalImages = images.slice();

							const mixer = document.createElement("span");

							mixer.id = "mixer-image";
							document.head.appendChild(mixer);

							let mixerImage = $(`#mixer-image`);

							mixerImage.attr("class", `${character}-mouth-talking${specificSpeech}`);
							images[1] = mixerImage.css("background-image");

							speaker.attr("class", "character-slot");
							speaker.css("background-image", images.join(", "));

							mixerImage.remove();
							mixer.remove();
						} else {
							speaker = null;
						}
					}

					// TODO: Add setting to control speed
					lastText.typeWrite({ speed: 55, cursor: false, color: "#c8c3bc" })
						.then(() => {
							if (type === "SPEECH" && speaker && originalImages && typewriting.includes(step)) {
								speaker.attr("class", "character-slot");
								speaker.css("background-image", originalImages.join(", "));
							}

							typewriting = typewriting.filter(i => i !== step);
						});
				} else {
					if (skipNotification) skipNotification.close();

					currentChoiceIndex = -1;
					keybindSelectedElement = null;
					window.story.makingChoice = true;

					$(`#text-area-${ui}-${step} > p`).contents().unwrap();

					lastText.children().each((index, element) => {
						maxChoiceIndex = index;
						$(element).attr("id", `choice-${index}`);
						$(element).after("<br>");
					});
				}
				break;
			}
		}

		debugMessage(`Stepped through passage ${step}.`);
	}
}

const processPassage = (twPassage) => {
	steps = [];
	currentStep = 0;
	lastTextStep = 0;
	inFlashback = false;

	// Populate steps list
	twPassage.find(customTags).each(function() {
		const element = $(this);

		steps.push([element.prop("tagName"), element.html(), element.attr("class")]);
	});

	debugMessage(`Processed passage with ${steps.length} steps.`);

	window.story.stepable = true;

	twPassage.empty();
	twPassage.append(`<div class="story-box"></div>`);

	stepPassage();
}

const initializeScript = (path) => {
	const script = document.createElement("script");
	script.src = path;

	return script
}

const executeScript = (script) => document.head.appendChild(script);

//
// Scripts
//

const helperScript = initializeScript("assets/javascript/helpers.js");
const gamepadScript = initializeScript("assets/javascript/gamepad.js");
const audioScript = initializeScript("assets/javascript/audio.js");
const galleryItemScript = initializeScript("assets/javascript/galleryItem.js");
const preloadScript = initializeScript("assets/javascript/preload.js");

// SimpleNotification
// https://github.com/Glagan/SimpleNotification
// https://github.com/Glagan/SimpleNotification/blob/master/LICENSE
const simpleNotificationScript = initializeScript("assets/javascript/mins/simpleNotification.min.js");

// jquery-typewriter-plugin
// https://github.com/0xPranavDoshi/jquery-typewriter
// https://github.com/0xPranavDoshi/jquery-typewriter/blob/master/LICENSE
const typewriterScript = initializeScript("assets/javascript/mins/typewriter.min.js");

// Drift
// https://github.com/imgix/drift
// https://github.com/imgix/drift/blob/main/LICENSE.md
const driftScript = initializeScript("assets/javascript/mins/Drift.min.js");

///
/// Initialization
///

// Adds Favicons
$("head").append(`
	<link rel="apple-touch-icon" sizes="180x180" href="assets/images/icons/apple-touch-icon.png">
	<link rel="icon" type="image/png" sizes="512x512" href="assets/images/icons/android-chrome-512x512.png">
	<link rel="icon" type="image/png" sizes="192x192" href="assets/images/icons/android-chrome-192x192.png">
	<link rel="icon" type="image/png" sizes="32x32" href="assets/images/icons/favicon-32x32.png">
	<link rel="icon" type="image/png" sizes="16x16" href="assets/images/icons/favicon-16x16.png">
`);

// Load all required scripts
executeScript(helperScript);
executeScript(gamepadScript);
executeScript(audioScript);
executeScript(galleryItemScript);
executeScript(simpleNotificationScript);
executeScript(typewriterScript);
executeScript(driftScript);

// Start preloading all images
executeScript(preloadScript);
