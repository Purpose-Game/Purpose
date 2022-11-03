/* global body, debugMessage, SimpleNotification */

//
//	Variables
//


let gamepadInputCheck;
let gamepadCheckInterval;
let anyGamepadAxisPressed = false;
let anyGamepadButtonPressed = false;

class GamePad {
	//
	//  Methods
	//

	// Cross-platform requestAnimationFrame
	static requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame; // eslint-disable-line no-redeclare

	// Cross-platform cancelAnimationFrame
	static cancelAnimationFrame = window.cancelAnimationFrame || window.mozCancelAnimationFrame; // eslint-disable-line no-redeclare

	// Polls for gamepads
	static pollGamepads() {
		debugMessage("Polling gamepads...");
		
		for (const gp of getGamepads()) {
			if (!gp) return;

			debugMessage("Gamepad polled");
			connectedNotification();
			GamePad.checkForGamepadInput();
			clearInterval(gamepadCheckInterval);
		}
	}

	// Checks for gamepad input
	static async checkForGamepadInput() {
		const gp = getGamepads()[0];

		if (!gp) {
			debugMessage("Gamepad connection lost");

			connectionLostNotification();
			setCheckInterval();
			return;
		}

		// Step story
		if (buttonPressed(gp.buttons[0])) {
			if (!anyGamepadButtonPressed) {
				if (window.story.makingChoice) {
					body.trigger({type: "keyup", keyCode: 13});
				} else {
					$(".story-box").trigger("click");
				}
			}

			anyGamepadButtonPressed = true;
		// Pause Game
		} else if (buttonPressed(gp.buttons[1])) {
			if (!anyGamepadButtonPressed) window.story.pauseMenu();

			anyGamepadButtonPressed = true;
		} else {
			anyGamepadButtonPressed = false;
		}

		let a = 0;
		let b = 0;
		
		if (gp.axes[0] !== 0) b -= gp.axes[0];
		
		if (gp.axes[1] !== 0) a += gp.axes[1];
		
		if (gp.axes[2] !== 0) b += gp.axes[2];
		
		if (gp.axes[3] !== 0) a -= gp.axes[3];

		const [left, right, up, down] = [b > 0.75, b < -0.75, a < -0.75, a > 0.75];

		if (up || left) {
			if (!anyGamepadAxisPressed) body.trigger({type: "keyup", keyCode: 38});

			anyGamepadAxisPressed = true;
		} else if (down || right) {
			if (!anyGamepadAxisPressed) body.trigger({type: "keyup", keyCode: 40});
			
			anyGamepadAxisPressed = true;
		} else {
			anyGamepadAxisPressed = false;
		}

		gamepadInputCheck = requestAnimationFrame(async () => await GamePad.checkForGamepadInput());
	}

	static async gamepadRumble(weak, strong = 0, duration = 500) {
		const gamepads = getGamepads();

		if (!gamepads) return;

		const gp = gamepads[0];

		if (!gp) return;

		if (gp.hapticActuators && gp.hapticActuators[0]) {
			await gp.hapticActuators[0].pulse(weak, duration);
		} else {
			await gp.vibrationActuator.playEffect("dual-rumble", {
				startDelay: 0,
				duration: duration,
				weakMagnitude: weak,
				strongMagnitude: strong,
			});
		}	
	}
}

//
//  Events
//

$(document).on("gamepadconnected", function() {
	debugMessage("Gamepad connected");
	GamePad.checkForGamepadInput();
	clearInterval(gamepadCheckInterval);
	connectedNotification();
});

$(document).on("gamepaddisconnected", function() {
	debugMessage("Gamepad disconnected");
	cancelAnimationFrame(gamepadInputCheck);
	disconnectedNotification();
	setCheckInterval();
});

//
//	Helper Functions
//

const getGamepads = () => navigator.getGamepads ? navigator.getGamepads() : (navigator.webkitGetGamepads ? navigator.webkitGetGamepads() : []);

// Checks if gamepad button pressed
function buttonPressed(b) {
	if (typeof b === "object") {
		return b.pressed;
	}
	
	return b === 1.0;
}

const setCheckInterval = () => gamepadCheckInterval = setInterval(() => GamePad.pollGamepads(), 2 * 1000);

const connectedNotification = () => SimpleNotification.success({ title: "Controller Connected" });

const disconnectedNotification = () => SimpleNotification.info({ title: "Controller Disconnected" });

const connectionLostNotification = () => SimpleNotification.warning({ title: "Controller Connection Lost" });

///
/// Initialization
///

// Polls for gamepad every 2 seconds if browser does not support events
if (!("ongamepadconnected" in window)) setCheckInterval();