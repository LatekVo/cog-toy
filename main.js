console.log('Script start');

let cogField = document.getElementById('cog-field');

let rootRotationSpeedDeg = 72; // deg, 5s/rot
let currentRootRotation = 0;
let oldTime = new Date();
let frameLength = 50;
let deltaT = 1;
let placementMode = false;
// to easily compute available space, we HAVE TO operate on a flat array
// sidenote on the approach to rotations: all we do is newRotation = parentRotation * parentRatio; This will prevent disparities coming from number roundings.
// update as to why i removed the tree: elements will aready be in-order, so updating left-right won't make a difference
// tfw no typescript :(
let cogMap = new Map();
class Cog {
    cogId; // sync between the cogMap, cogTree and the DOM
    // references in js like to act funky but as long as i add the same cog object to all lists it should be shared across all of them.
    childrenList = [];
    parentId = undefined;
    domElement; // DOM Node
    spokeList; // Array { domElement: Node, rotation }
    currentRotation = 0;
    parentRotationRatio = 1;
    cogX = 0; 
    cogY = 0;
    cogR = 1;
    fix_rotationOffset = 0;
    getDistance(tX, tY, tR) {
        return Math.hypot(tX - this.cogX, tY - this.cogY) - tR - this.cogR; // simple pythagorean minus both radii
    }
    updateRotation(parentRotation) {
        this.currentRotation = parentRotation * this.parentRotationRatio + this.fix_rotationOffset;
        this.childrenList.forEach((child) => {
            child.updateRotation(Math.abs(this.currentRotation));
        });
        let indexOffset = 360 / this.spokeList.length;
        this.spokeList.forEach((spoke, index) => {
            let spokeRotation = this.currentRotation + index * indexOffset ;
            spoke.style.rotate = `${spokeRotation}deg`;
        });
    }
    constructor(x, y, radius, cogId, parentId, domElement, spokeList) {
        this.domElement = domElement;
        this.spokeList = spokeList;
        this.cogId = cogId;
        this.parentId = parentId;
        this.cogX = x;
        this.cogY = y;
        this.cogR = radius;
        if (parentId !== undefined) {
            let parentCog = cogMap.get(this.parentId);
            //console.log(parentCog);
            // simple math: rotation speed = parent cogs / child cogs
            this.parentRotationRatio = parentCog.spokeList.length / this.spokeList.length;
            // connected cogs rotate in reverse directions
            //console.log('child:', this.parentRotationRatio, 'parent:', parentCog.parentRotationRatio);
            this.parentRotationRatio *= -Math.sign(parentCog.parentRotationRatio);     
            //console.log('child:', this.parentRotationRatio, 'parent:', parentCog.parentRotationRatio);
        }
    }
}

let getNearestCog = (x, y) => {
    let nearestDist = Number.MAX_VALUE;
    let nearestId = -1;
    cogMap.forEach((cog, cogId) => {
        let checkedDist = cog.getDistance(x, y, 0);
        if (checkedDist < nearestDist) {
            nearestDist = checkedDist;
            nearestId = cogId;
        }
    });
    return {cogDistance: nearestDist, cogId: nearestId};
}

let fixAlignmentIssue = (cog, perimeterLength) => {
    let parentCog = cogMap.get(cog.parentId);
    if (parentCog == undefined)
        return;
    // this got revealed to me in my dream
    // rotate 180 to align our top spoke to parent's top spoke, they are perfectly aligned (figure out to make this work for multiple linked cogs)
    // rotate by 1/2 labda of our cog (we treat our cog as a square wave of spokes)
    // rotate by +azimuth of the parent cog, to adjust the angular difference between the perfectly aligned top and our current position
    let halfSpokeLambda = perimeterLength / cog.spokeList.length / 2;
    vec_x = parentCog.cogX - cog.cogX;
    vec_y = parentCog.cogY - cog.cogY;
    let parentAzimuth = Math.atan2(vec_x, vec_y) * 180 / Math.PI; // almost identical for both cogs as both cog centers and the touchpoint stand on a single straight line 

    // the rotation adjustment has to be as small as possible to avoid some startup bugs
    // first we snap to nearest cog, then adjust by half spoke lambda
    // the offset of spoke from the touch point is azimuth mod lambda, we get that for both the parent and the child 
    // we get these offsets of both the parent and the child, then fix the child by it's offset + the offset of the parent
    // final offset: 1/2 lambda + own azimuth correction + parent azimuth correction * parent's ratio
    let childInterOffset = parentAzimuth % cog.spokeList.length; // current position of parent compared to child's nearest spoke
    let parentInterOffset = (parentAzimuth + 180) % parentCog.spokeList.length; // we correct by parent as well so that if parent is already aligned to other cog, we fix by that as well
    console.log('offset values', childInterOffset, parentInterOffset);

    cog.fix_rotationOffset = childInterOffset - parentInterOffset + halfSpokeLambda;
}

let addCog = (x, y, isVirtual) => {
    let cogId = cogMap.size;
    // hardcoded variables for root element
    let parentId = undefined;
    // add cog is a direct interaction function, all we get is where user clicked, and so we compute the size of our desired cog and n of cogs it requires
    let radius = 50; // distance_to_parent - parent_radius - (spoke_height * 2)
    let nSpokes = 6; // radius / spoke_width / 2
    let circumference = -1;
    if (cogMap.size != 0) {
        // find nearest parent and connect to it.   
        let nearestCog = getNearestCog(x, y);
        parentId = nearestCog.cogId;
        radius = nearestCog.cogDistance - 25; // distance_to_parent - parent_radius - (spoke_height * 2)
        let halfCircumference = Math.PI * radius;
        circumference = halfCircumference * 2;
        nSpokes = halfCircumference / 30; // circumference / spoke_width / 2
    }

    console.log(`New cog: x: ${x}, y: ${y}, radius: ${radius}, n of spokes: ${nSpokes}, parent id: ${parentId}`)

    let newDomCog = document.createElement('div');
    newDomCog.classList.add('cog');
    newDomCog.style.width = `${radius * 2}px`;
    newDomCog.style.top = `${y}px`;
    newDomCog.style.left = `${x}px`;
    let spokeList = new Array();

    for(let i = 0; i < nSpokes; i++) {
        let degRot = i * 360 / nSpokes;
        let newSpoke = document.createElement('div');
        newSpoke.style.rotate = `${degRot}deg`;
        newSpoke.style.transform = `translateY(-${radius+8}px)`
        newSpoke.classList.add('spoke');
        spokeList.push(newDomCog.appendChild(newSpoke));
    }

    let cogDomRef = cogField.appendChild(newDomCog);

    let newCog = new Cog(
        x, 
        y, 
        radius, 
        cogId,
        parentId,
        cogDomRef,
        spokeList);

    fixAlignmentIssue(newCog, circumference);

    if (!isVirtual) {
        cogMap.set(cogId, newCog);

        if (parentId != undefined) {
            cogMap.get(parentId).childrenList.push(newCog);
        }
    }
}

addCog(window.screen.width / 2, window.screen.height / 2);
addCog(window.screen.width / 2 - 200, window.screen.height / 2 + 10);
addCog(window.screen.width / 2 - 300, window.screen.height / 2 - 300);


// while JS is single-thread, i believe multithreading will be simulated when using setInterval, thus these mutex locks are neccesary.
let placementReady = true; // ensures only one placement loop instance is run at a time, as placement loop may be resource intensive
let rotationReady = true; // similar to placementReady, rotation updating may take even longer.
let virtualCog = undefined; // cog's green hologram rendered when placementMode is active, it follows the cursor but follows all other cog laws.

//cogMap.get(0).updateRotation(currentRootRotation); // TEMPORARY
setInterval(() => {
    let currentTime = new Date();
    deltaT = (currentTime - oldTime) / frameLength;
    currentRootRotation += rootRotationSpeedDeg * deltaT * frameLength / 1000; 

    if (placementMode && placementReady) {
        placementReady = false;
        let getNearestCog = getNearestCog;

        placementReady = true;
    }

    if (rotationReady) {
        rotationReady = false;
        cogMap.get(0).updateRotation(currentRootRotation);
        rotationReady = true;
    }

    // clockHandlerSecond.style.rotate = `${secondDeg*6}deg`;
    oldTime = currentTime;
}, frameLength);

document.getElementById('create-cog-button').onmouseup = () => {
    setTimeout(() => {
        placementMode = true;
    }, 500);
};

document.onclick = (event) => {
    if (placementMode) {
        console.log('new cog placed by user at:', event.clientX, event.clientY);
        addCog(event.clientX, event.clientY);
        placementMode = false;
    }
}