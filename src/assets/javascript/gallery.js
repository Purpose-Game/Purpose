// Steam-like Trading Card Interaction
// https://github.com/imchell/steam-like-card-curation

// eslint-disable-next-line  no-unused-vars
class Gallery {
    //
	//  Constructor
	//
    constructor() {
        this.item = document.getElementById("gallery-image");

        this.calculate(this.item);

        //
        //  Events
        //

        window.addEventListener("resize", () => this.calculate(this.item));
    
        this.item.addEventListener("mousemove", (event) => {
            this.item.style.transform = `
                perspective(1000px)
                rotateY(${this.rotate(event.x, this.centerX)}deg)
                rotateX(${-this.rotate(event.y, this.centerY)}deg)
            `;
            this.item.style.filter = `brightness(${this.brightness(event.y, this.centerY)})`;
        })
    
        this.item.addEventListener("mouseleave", () => {
            this.item.style.transform = `perspective(500px)`;
            this.item.style.filter = `brightness(1)`;
        })
    }

    //
	//  Methods
	//

    calculate = (item) => {
        this.rect = item.getBoundingClientRect();
        this.centerX = this.rect.left + this.rect.width / 2;
        this.centerY = this.rect.top + this.rect.height / 2;
    }

    brightness = (cursorPositionY, centerPositionY, strength = 50) => 1 - (this.rotate(cursorPositionY, centerPositionY) / strength);

    rotate = (cursorPosition, centerPosition, threshold = 20) => {
        if (cursorPosition - centerPosition >= 0) {
            return (cursorPosition - centerPosition) >= threshold ? threshold : (cursorPosition - centerPosition);
        } else {
            return (cursorPosition - centerPosition) <= -threshold ? -threshold : (cursorPosition - centerPosition);
        }
    }
}