/* global debugMessage */

const requiredImages = [
    // Buttons
    "buttons/options.png",
    "buttons/options-active.png",
    "buttons/save.png",
    "buttons/save-active.png",

    // Characters
    // Lucy
    "characters/lucy/stance/neutral.png",

    // Sarah
    "characters/sarah/stance/neutral.png",

    // Tiffany
    "characters/tiffany/eyes/confused.gif",
    "characters/tiffany/eyes/happy.gif",
    "characters/tiffany/eyes/neutral.gif",
    "characters/tiffany/eyes/sad.gif",
    "characters/tiffany/eyes/scared.gif",

    "characters/tiffany/mouth/confused.png",
    "characters/tiffany/mouth/happy.png",
    "characters/tiffany/mouth/neutral.png",
    "characters/tiffany/mouth/sad.png",
    "characters/tiffany/mouth/talking.gif",
    
    "characters/tiffany/stance/neutral.png",
    "characters/tiffany/stance/neutral_backpack.png",
    "characters/tiffany/stance/scared.png",
    "characters/tiffany/stance/scared_backpack.png",

    // Unknown
    "characters/unknown/neutral.png",

    // Specials
    // Items
    "specials/items/beans.png",

    // Places
    "specials/places/backdoor.png",
    "specials/places/backwall.png",
    "specials/places/backwindow.png",
    "specials/places/garden.png",
    "specials/places/kitchen.png",

    // Story-Box
    
    "story-box/character-name.png",
    "story-box/character-slot.png",
    "story-box/character-slot-outline.png",
    "story-box/special.png",
    "story-box/special-outline.png",

    // Text-Area
    // Big
    "story-box/text-area/big/text-area.png",
    "story-box/text-area/big/text-area-outline.png",

    // Small
    "story-box/text-area/small/text-area.png",
    "story-box/text-area/small/text-area-outline.png",

    // Titles
    "titles/title-image.png",
];
const dir = "assets/images/ui/";
const loadingBar = $("#loading-bar");

let loaded = 0;
let needToLoad = requiredImages.length;

debugMessage(`Starting to load ${needToLoad} images`);

for (const image of requiredImages) {
    const path = dir + image;

    const element = document.createElement("link");
    element.rel = "prefetch";
    element.as = "image";
    element.onload = imageLoaded;
    element.href = path;

    document.head.appendChild(element);
}

async function imageLoaded() {
    loadingBar.val((++loaded / needToLoad) * 100);

    if (loaded == needToLoad) {
        debugMessage(`Finished loading ${loaded} images`);

        $("tw-passage").append(`<br><a href="javascript:void(0)" class="sound-click" onclick="window.story.show('Test Passage')">[Continue]</a>`);
    }
}