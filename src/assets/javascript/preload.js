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
    "characters/sarah/eyes/angry.gif",
    "characters/sarah/eyes/fighting.gif",
    "characters/sarah/eyes/happy.gif",
    "characters/sarah/eyes/limping.gif",
    "characters/sarah/eyes/neutral.gif",
    "characters/sarah/eyes/pain.gif",
    "characters/sarah/eyes/sad.gif",

    "characters/sarah/mouth/angry.png",
    "characters/sarah/mouth/fighting.png",
    "characters/sarah/mouth/happy.png",
    "characters/sarah/mouth/limping.png",
    "characters/sarah/mouth/neutral.png",
    "characters/sarah/mouth/pain.png",
    "characters/sarah/mouth/sad.png",
    "characters/sarah/mouth/talking.gif",
    "characters/sarah/mouth/talking_fighting.gif",
    "characters/sarah/mouth/talking_limping.gif",

    "characters/sarah/stance/fighting.png",
    "characters/sarah/stance/fighting_backpack.png",
    "characters/sarah/stance/limping.png",
    "characters/sarah/stance/limping_backpack.png",
    "characters/sarah/stance/neutral.png",
    "characters/sarah/stance/neutral_backpack.png",

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
    "specials/items/machines.png",
    "specials/items/tap.png",

    // Places
    "specials/places/backdoor.png",
    "specials/places/backstreet.png",
    "specials/places/backwall.png",
    "specials/places/backwindow.png",
    "specials/places/garden.png",
    "specials/places/kitchen.png",
    "specials/places/laundryroom.png",

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