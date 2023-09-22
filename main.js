let cogField = document.getElementById('cog-field');

let oldTime = new Date();
let frameLength = 50;
let placementMode = false;

let addCog = (x, y, sizePx, nSpokes) => {
    let newCog = document.createElement('div');
    newCog.classList.add('cog');
    newCog.style.width = `${sizePx}px`;
    newCog.style.top = `${y}px`;
    newCog.style.left = `${x}px`;
    let spokeList = new Array();
    for(let i = 0; i < nSpokes; i++) {
        let degRot = i * 360 / nSpokes;
        let newSpoke = document.createElement('div');
        newSpoke.style.rotate = `${degRot}deg`;
        newSpoke.style.transform = `translateY(-${sizePx/2+8}px)`
        newSpoke.classList.add('spoke');
        spokeList.push(newCog.appendChild(newSpoke));
    }
    return {domElement: cogField.appendChild(newCog), spokeList: spokeList};
}

// to easily compute available space, we HAVE TO operate on a flat array
// we are storing these separately as it seems as the best of both worlds, of both the flat array and a recursive connection map
// tfw no typescript :(
/* cogListPositionData: [{x, y, r}] */
let cogListPositionData;
let rootCog; 
class Cog {
    domElement; // DOM Node
    spokeList; // Array { domElement: Node, rotation }
    constructor(x, y, radius) {
        let cogData = addCog(x, y, radius * 2, 6);
        domElement = cogData.domElement;
        spokeList = cogData.spokeList;
    }
}
cogListPositionData = new Array();
rootCog = new Cog(window.screen.width / 2, window.screen.height / 2, 50);
setInterval(() => {
    let currentTime = new Date();
    let deltaT = (currentTime - oldTime) / frameLength;
    if (placementMode) {

    }


    // clockHandlerSecond.style.rotate = `${secondDeg*6}deg`;
    oldTime = currentTime;
}, frameLength);