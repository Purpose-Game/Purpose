/* global debugMessage */

const images = [
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
    "specials/places/kitchen.png",
];
const dir = "assets/images/ui/";

let loaded = 0;
let needToLoad = images.length;

debugMessage(`Starting to load ${needToLoad} images`);

for (const image of images) {
    const path = dir + image;

    const element = document.createElement("link");
    element.rel = "prefetch";
    element.as = "image";
    element.onload = imageLoaded;
    element.href = path;

    document.head.appendChild(element);
}

function imageLoaded() {
    ++loaded;
    console.log(`${loaded} loaded...`);
    if (loaded == needToLoad) {
        console.log("All images loaded!");
    }
}