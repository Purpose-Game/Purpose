/* global SimpleNotification, body, debugMessage, sleep, audioHelpers, audioLibrary */

const apiUrl = "https://purpose-game.com/api";

let menuMusic;
let notification;
let prePausePassage;
let achievementsEnabled = true;
let customFontEnabled = true;

// Checks connection to API
window.story.networkCheck = (nextPassage) => {
	$.get(`${apiUrl}/status`)
        .done(() => window.story.network = true)
        .catch((error) => {
            debugMessage(`Connection to server failed: "${error}".`);

            window.story.noConnection();
        })
        .then(() => window.story.show(nextPassage));
}

// Shows connection error message
window.story.noConnection = () => SimpleNotification.error({
    title: "Network Connection Failed!",
    text: "Could not connect to the remote server, Cloud Saving unavailable."
}, {
    duration: 10 * 1000,
    position: "bottom-right"
});

// Redirects one passage to another after a given period of time
window.story.redirect = async (pageName, time = 5) => {
	debugMessage(`Redirecting to ${pageName} in ${time} seconds.`);

	await sleep(time * 1000);

    window.story.show(pageName);
};

// Sets an achievement and shows a popup
window.story.achievement = (chapter, shorthand, title, text) => {
    if (!Object.prototype.hasOwnProperty.call(window.story.state.achievements, chapter)) window.story.state.achievements[chapter] = {};
    
    if (Object.prototype.hasOwnProperty.call(window.story.state.achievements[chapter], shorthand)) {
        debugMessage(`Chapter ${chapter} achievement ${shorthand} already earned.`);
        return;
    } else {
        debugMessage(`Chapter ${chapter} achievement ${shorthand} earned, showing ${achievementsEnabled}.`);
    }

    window.story.state.achievements[chapter][shorthand] = true;

	if (!achievementsEnabled) return;

    SimpleNotification.info({
        title: `Achievement: ${title}`,
        text,
    }, {
        duration: 10 * 1000,
        position: "bottom-right",
        closeButton: false,
        closeOnClick: false
    });
};

// Sets a story choice
window.story.setChoice = (chapter, choice, value = true) => {
	debugMessage(`Chapter ${chapter} choice ${choice} set to "${value}".`);

    if (!Object.prototype.hasOwnProperty.call(window.story.state.choices, chapter)) window.story.state.choices[chapter] = {};

	window.story.state.choices[chapter][choice] = value;
};

// Returns a story choice
window.story.getChoice = (chapter, choice) => {
    if (Object.prototype.hasOwnProperty.call(window.story.state.choices[chapter], choice)) return window.story.state.choices[chapter][choice];

	return null;
};

// Gets all set choices for a chapter
window.story.getChoices = (chapter) => {
    if (Object.prototype.hasOwnProperty.call(window.story.state.choices, chapter)) return Object.entries(window.story.state.choices[chapter]);
	
    return [];
}

// Returns the name picked for Tiffany
window.story.tiffany = () =>
    Object.prototype.hasOwnProperty.call(window.story.state.choices, "Chapter1") &&
    Object.prototype.hasOwnProperty.call(window.story.state.choices["Chapter1"], "TiffanyName")
        ? window.story.state.choices["Chapter1"]["TiffanyName"] : "Tiffany";

// Links a player's account to the current session
window.story.linkCode = () => {
	const input = $("#linkingCode");
	const button = $("#linkingCodeButton");
	const code = input.val();
    const resetInput = () => {
        input.prop("disabled", false);
        button.attr("onclick", "window.story.linkCode()");
    };
	
	notification = SimpleNotification.info({
		title: "Linking Account..."
	}, {
		position: "bottom-right"
	});
	
    button.attr("onclick", "");
	input.prop("disabled", true);
	
	if (!code || code === "") {
		debugMessage(`Empty linking code provided.`);

		notification.setType("error");
		notification.setTitle("Error: No Code");
		notification.setText("No code entered!");
		
		resetInput();
		return;
	}
	
	if (code.length != 9) {
		debugMessage(`Linking code wrong length.`);

		notification.setType("error");
		notification.setTitle("Error: Invalid Code");
		notification.setText("Entered code is invalid!");

		resetInput();
		return;
	}
	
	$.post(`${apiUrl}/link`, { code })
        .done((data) => {
            debugMessage(`Account linked with code "${code}".`);

            notification.setType("success");
            notification.setTitle("Account Linked!");
            
            window.story.player.name = data.userName;
            window.story.player.id = data.userId;
            window.story.player.key = data.userKey;

            debugMessage(`Name: "${window.story.player.name}", ID: "${window.story.player.id}", User Key: "${window.story.player.key}"`);
            
            window.story.saving = true;
            window.story.show("Linked");
        })
        .catch((error) => {
            debugMessage(`Account failed to link with code "${code}": "${error}".`);

            SimpleNotification.error({
                title: `Error: ${error.status}`,
                text: error.responseText
            }, {
                position: "bottom-right"
            });

            resetInput();
        });
}

// Saves game
// TODO: Rewrite save system
window.story.saveGame = (manual = false) => {
	if (!window.story.saving) {
		SimpleNotification.error({
			title: `Error: Saving Not Enabled`
		}, {
			position: "bottom-right"
		});
		return;
	}

	notification = SimpleNotification.info({
		title: `${manual ? "" : "Auto-"}Saving...`
	}, {
		position: "bottom-right"
	});

	$.post(`${apiUrl}/save`, {
            key: window.story.player.key,
            data: {
                saveSlot: window.story.saveSlot,
                saveData: JSON.stringify(window.story.state)
            }
        })
        .done(() => {
            notification.setType("success");
            notification.setTitle(`${manual ? "" : "Auto-"}Save Complete!`);
        })
        .catch((error) => {
            debugMessage(`Game failed to save: "${error}"`);

            notification.setType("error");
            notification.setTitle(`${manual ? "" : "Auto-"}Save Failed!`);
            notification.setText(error.responseText);
        });
}

// Loads all saves
// TODO: Rewrite save system
window.story.loadSaves = (newGame = false) => {
	$.post(`${apiUrl}/saves`, { key: window.story.player.key })
        .done((data) => {
            debugMessage(`Loaded ${data.length} saves for "${window.story.player.key}".`);

            $("#slotsLoading").hide();
            
            if (data.length === 0 && !newGame) {
                SimpleNotification.message({
                    title: "No Saved Games!"
                }, {
                    position: "bottom-right"
                });
                return;
            }

            if (!newGame) {
                $.each(data, (_, value) => {
                    $("#savesContainer").append(`
                        <a onclick="window.story.loadSave(${value.slot})">
                            <u>Save Slot ${value.slot}</u><br>
                            Chapter: ${value.data.lastPassage.charAt(1)}<br>
                            Last passage: ${value.data.lastPassage}<br>
                            Last Used: ${new Date(value.lastActive).toLocaleDateString()}
                        </a>
                    `);
                });
            } else {
                $.each(data, (_, value) => $("#saveSlot" + value.slot).text("Save Slot " + value.slot + " (In Use)"));
            }

            $(newGame ? "#saveSlotSelector" : "#savesContainer").fadeIn(500);
        }).catch((error) => {
            debugMessage(`Failed to load saves for "${window.story.player.key}": "${error}"`);

            SimpleNotification.error({
                title: "Load Failed!",
                text: error.responseText
            }, {
                position: "bottom-right"
            });
        });
}

// Loads a player's save
window.story.loadSave = async function (saveSlot) {
	window.story.show("Loading Save");

	notification = SimpleNotification.info({
		title: "Loading Save..."
	}, {
		position: "bottom-right"
	});
	
	$.post(`${apiUrl}/load`, {
		key: window.story.player.key,
		saveSlot: saveSlot,	
	}).done(async function(data) {
		debugMessage(`Loaded save ${saveSlot} for ${window.story.player.key}`);

		window.story.state = data;
		window.story.saveSlot = saveSlot;
		
		notification.setType("success");
		notification.setTitle("Save Loaded!");

		await sleep(1000);

        window.story.show(window.story.state.lastPassage);
	}).catch(async function(error) {
		debugMessage(`Failed to load save ${saveSlot} for ${window.story.player.key}: ` + error);

		notification.setType("error");
		notification.setTitle("Load Failed!");
		notification.setText(error.responseText);
		
		await sleep(1000);

        window.story.show("Saved Games");
	});
}

// Hides generate button and shows linking form
window.story.toggleLinkingDisplays = function (reverse = false) {
	debugMessage(`Linking buttons toggled (${reverse})`);
	
	if (!reverse) {
		$("#generateButton").hide();
		$("#linkingForm").show();
	} else {
		$("#generateButton").show();
		$("#linkingForm").hide();
	}
}

// Selects a slot of a new game, and starts new game
window.story.selectSlot = async function () {
	debugMessage(`Starting game in save slot ${$("#slots").val()}`);

	window.story.saveSlot = $("#slots").val();
	
	SimpleNotification.info({
		title: "Save Slot " + window.story.saveSlot + " Selected"
	}, {
		position: "bottom-right"
	});
	
	await sleep(1000);
    
    window.story.show("C1 Intro");
}

// Toggles Custom Font
window.story.toggleFont = function () {
	debugMessage(`Font toggled (${!customFontEnabled})`);

	customFontEnabled = !customFontEnabled;
	
	if (customFontEnabled) {
		body.css({
			"font-size": "unset",
			"font": "27px 'DeadWalking', Arial, sans-serif"
		});
	} else {
		body.css({
			"font": "unset",
			"font-size": "27px"
		});
	}
	
	SimpleNotification.info({
		title: `Font ${customFontEnabled ? "Enabled" : "Disabled"}`
	}, {
		duration: 2 * 1000,
		position: "bottom-right",
		closeButton: false,
		closeOnClick: false
	});
}

// Loads statistics
window.story.loadStats = function () {
	$.post(`${apiUrl}/stats`, {
		key: window.story.player.key,
		chapter: window.story.state.chapter
	}).done(function(data) {
		debugMessage(`Loaded ${data.length} stats for chapter ${window.story.state.chapter} ${window.story.player.key}`);

		$("#statsLoading").hide();
		
		for (const stat in data) {
			if (
				!window.story.state.choices[window.story.state.chapter] ||
				// If choice was never set, not to be confused with choice being set to false
				!Object.prototype.hasOwnProperty.call(window.story.state.choices[window.story.state.chapter], stat)
			) {
				continue;
			}
			
			let message;
			
			if (window.story.getChoice(window.story.state.chapter, stat)) {
				message = `You and ${data[stat][0]} of players ${window.story.choiceDescriptions[window.story.state.chapter][stat][0]}`;
			} else {
				message = `You and ${data[stat][1]} of players ${window.story.choiceDescriptions[window.story.state.chapter][stat][1]}`;
			}
			
			$("#statsContainer").append(`<p>${message}</p><progress class="did-bar" value="${data[stat][0].slice(0, -1)}" max="100"></progress><br><progress class="did-not-bar" value="${data[stat][1].slice(0, -1)}" max="100"></progress>`);	
		}
		
		$("#statsContainer").fadeIn(500);
	}).catch(function(error) {
		debugMessage(`Failed to load stats for chapter ${window.story.state.chapter} ${window.story.player.key}`);

		SimpleNotification.error({
			title: "Load Failed!",
			text: error.responseText
		}, {
			position: "bottom-right"
		});
	});
}

// Loads achievements
window.story.loadAchievements = async function () {
	// Fake loading to allow the passage to load or else jQuery won't make the changes
    // TODO: Huh? Look into this, ?really required
	await sleep(1000);

    $("#achievementsLoading").hide();

		let earnedAchievements = 0;
		const totalAchievements = Object.entries(window.story.achievementDescriptions[window.story.state.chapter]).length;

		$("#achievementsCounter").text(`${earnedAchievements}/${totalAchievements} Achievements Earned`);

		for (const [internal, [name, description]] of Object.entries(window.story.achievementDescriptions[window.story.state.chapter])) {
			if (!window.story.state.achievements[window.story.state.chapter] || !window.story.state.achievements[window.story.state.chapter][internal]) {
				continue;
			}

			$("#achievementsCounter").text(`${++earnedAchievements}/${totalAchievements} Achievements Earned`);

			$("#achievementsContainer").append(`<p>- <b>${name}</b>: ${description.replaceAll("*", "")}</p>`);
		}

		if (totalAchievements > 0) $("#achievementsContainer").append(`<hr>`);

		$("#achievementsCounter").fadeIn(500);
		$("#achievementsContainer").fadeIn(500);
}

// Toggles opening of pause menu
window.story.pauseMenu = async function () {
	debugMessage(`Pause menu toggled (${prePausePassage == null})`);

	if (prePausePassage == null) {
		prePausePassage = window.passage.name;

		window.story.show("Pause Menu");

		await audioHelpers.toggleBackgroundMusic();

		window.story.startMenuMusic(true);
	} else {
		window.story.show(prePausePassage);
		window.story.stopMenuMusic(menuMusic);

		audioHelpers.toggleBackgroundMusic();

		prePausePassage = null;
	}
}

// Toggles showing of achievements
window.story.toggleAchievements = function () {
	debugMessage(`Achievements toggled (${!achievementsEnabled})`);

	achievementsEnabled = !achievementsEnabled;
	
	SimpleNotification.info({
		title: `Achievements ${achievementsEnabled ? "Enabled" : "Disabled"}`
	}, {
		duration: 2 * 1000,
		position: "bottom-right",
		closeButton: false,
		closeOnClick: false
	});
}

// Renders a passage and replaces text
window.story.customRender = function (passageName) {
	const passage = window.story.passage(passageName);

	// Replace %Tiffany% with what the player chose to call Tiffany
	if (passage.source.includes("%Tiffany%")) {
		passage.source = passage.source.replaceAll("%Tiffany%", window.story.tiffany());
	}
	
	return window.story.render(passageName);
}

// Starts menu music
window.story.startMenuMusic = async function (pauseMenu = false) {
	if (menuMusic) await audioHelpers.killMusic(menuMusic);

	debugMessage("Main menu music started");

	menuMusic = await audioHelpers.playMusic(!pauseMenu ? audioLibrary.music.menu.main_menu : audioLibrary.music.menu.pause_menu);
}

// Stops the menu music
window.story.stopMenuMusic = async function () {
	if (!menuMusic) return;

	await audioHelpers.stopMusic(menuMusic);

	menuMusic = null;

	debugMessage("Main menu music stopped");
}

//
// External Helpers
//

// toggleFullscreen.js
// https://gist.github.com/demonixis/5188326
window.story.toggleFullscreen = function (event) {
	let element = document.documentElement;

	if (event instanceof HTMLElement) element = event;

	const isFullscreen = document.webkitIsFullScreen || document.mozFullScreen || false;

	debugMessage(`Fullscreen toggled (${!isFullscreen})`);

	element.requestFullScreen = element.requestFullScreen || element.webkitRequestFullScreen || element.mozRequestFullScreen || function () { return false; };
	document.cancelFullScreen = document.cancelFullScreen || document.webkitCancelFullScreen || document.mozCancelFullScreen || function () { return false; };

	isFullscreen ? document.cancelFullScreen() : element.requestFullScreen();
}