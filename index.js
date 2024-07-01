// Initialize fabric canvas
var canvas = new fabric.Canvas('imageCanvas');
var currentNumber = 1;
var annotationMap = {};  // Keep track of annotations
var images = [];  // Track loaded images
var drawingMode = null;  // Track the current drawing mode
var customShape = { path: [] };  // Store custom shape path
var deletedImageUrls = new Set();
var isDrawing = false;
canvas.on('mouse:down', function(o) {
    images.forEach(function(img) {
        img.sendToBack();
    });
});
// Function to set drawing mode
function setDrawingMode(mode) {
    drawingMode = mode;
    customShape = new fabric.Path(''); // Reset custom shape path
    if (mode) {
        lockImages(true);  // Lock image movement during drawing
    } else {
        canvas.forEachObject(function(obj) {
            obj.set({
                selectable: true,
                evented: true,
            });
        });
        lockImages(false);
    }
    console.log(`Drawing mode set to: ${mode}`);
    resetCanvasListeners();
}
// Track mouse clicks on the canvas
// Event listener for mouse down on the canvas
canvas.on('mouse:down', function(o) {
    console.log('Clicked on blank canvas area');
    var pointer = canvas.getPointer(o.e);
    var clickedObject = canvas.findTarget(o.e);

    if (!clickedObject) {
        // Clicked on blank canvas area (no objects)
        console.log('Clicked on blank canvas area');
        // Enable panning/moving the canvas
        canvas.isDragging = true;
        canvas.selection = false; // Disable object selection temporarily
        canvas.lastPosX = pointer.x;
        canvas.lastPosY = pointer.y;
    } else {
        // Clicked on an object
        console.log('Clicked on object:', clickedObject);
        // Handle clicks on specific object types
        if (clickedObject.type === 'image') {
            bringImagesfromBack();
        } else if (clickedObject.type === 'line') {
            // Handle click on line object
        } else {
            sendImagesToBack();
        }
    }
});

// Event listener for mouse move on the canvas
canvas.on('mouse:move', function(o) {
    if (canvas.isDragging) {
        var pointer = canvas.getPointer(o.e);
        var delta = new fabric.Point(pointer.x - canvas.lastPosX, pointer.y - canvas.lastPosY);
        canvas.relativePan(delta);
        canvas.lastPosX = pointer.x;
        canvas.lastPosY = pointer.y;
    }
});

// Event listener for mouse up on the canvas
canvas.on('mouse:up', function(o) {
    canvas.isDragging = false;
    canvas.selection = true; // Re-enable object selection
});


// Event handler for mouse down event
canvas.on('mouse:down', function (options) {
    if (!drawingMode) return;

    isDrawing = true;
    const pointer = canvas.getPointer(options.e);
    startX = pointer.x;
    startY = pointer.y;

    console.log(`Mouse down at (${startX}, ${startY})`);

    switch (drawingMode) {
        case 'rectangle':
            drawingObject = new fabric.Rect({
                left: startX,
                top: startY,
                width: 0,
                height: 0,
                fill: 'transparent',
                stroke: 'red',
                strokeWidth: 2
            });
            break;
        case 'circle':
            drawingObject = new fabric.Circle({
                left: startX,
                top: startY,
                radius: 0,
                fill: 'transparent',
                stroke: 'red',
                strokeWidth: 2,
                originX: 'center',
                originY: 'center'
            });
            break;
        case 'arrow':
            drawingObject = new fabric.Line([startX, startY, startX, startY], {
                stroke: 'red',
                strokeWidth: 2,
                originX: 'center',
                originY: 'center'
            });
            drawingObject.head = new fabric.Triangle({
                left: startX,
                top: startY,
                originX: 'center',
                originY: 'center',
                selectable: false,
                pointType: 'arrow_start',
                angle: 45,
                width: 10,
                height: 15,
                fill: 'red'
            });
            break;
    }

    if (drawingObject) {
        canvas.add(drawingObject);
        if (drawingMode === 'arrow') {
            canvas.add(drawingObject.head);
        }
    }

    console.log('Drawing object initialized:', drawingObject);
});
// Event handler for mouse move event
canvas.on('mouse:move', function (options) {
    if (!isDrawing || !drawingObject) return;
    const pointer = canvas.getPointer(options.e);
    const x = pointer.x;
    const y = pointer.y;
    console.log(`Mouse move at (${x}, ${y})`);
    switch (drawingMode) {
        case 'rectangle':
            drawingObject.set({
                width: Math.abs(x - startX),
                height: Math.abs(y - startY)
            });
            if (x < startX) {
                drawingObject.set({ left: x });
            }
            if (y < startY) {
                drawingObject.set({ top: y });
            }
            break;
        case 'circle':
            const radius = Math.max(Math.abs(x - startX), Math.abs(y - startY)) / 2;
            drawingObject.set({ radius: radius });
            if (x < startX) {
                drawingObject.set({ left: startX - radius });
            }
            if (y < startY) {
                drawingObject.set({ top: startY - radius });
            }
            break;
        case 'arrow':
            drawingObject.set({
                x2: x,
                y2: y
            });
            const angle = Math.atan2(y - startY, x - startX) * 180 / Math.PI;
            drawingObject.head.set({
                left: x,
                top: y,
                angle: angle + 90
            });
            break;
    }

    console.log('Drawing object updated:', drawingObject);
    canvas.renderAll();
});
// Event handler for mouse up event
canvas.on('mouse:up', function () {
    isDrawing = false;
    drawingObject = null;
    console.log('Mouse up, drawing completed.');
});
// Function to send images to back and make them non-selectable
function sendImagesToBack() {
    imageObjects.forEach(function(image) {
        image.set({
            selectable: true,
            evented: true // Make image non-evented to prevent accidental movements
        });
        canvas.sendToBack(image);
    });
    canvas.renderAll();
}
function bringImagesfromBack() {
    if (!canvas || imageObjects.length === 0) {
        console.error("Canvas not initialized or no image objects available.");
        return;
    }
    try {
        imageObjects.forEach(function(image) {
            console.log("Bringing image to front");
            image.set({
                selectable: true,
                evented: true // Make image evented to allow interactions
            });
            canvas.bringToFront(image);
        });
        canvas.renderAll();
    } catch (error) {
        console.error("Error in bringImagesfromBack:", error);
    }
}

function uploadImage() {
    document.getElementById('file').click();
}
// Event listeners for buttons
document.getElementById('imageLoader').addEventListener('change', handleImage, false);
document.getElementById('drawLine').addEventListener('click', () => setDrawingMode('line'));
document.getElementById('drawCircle').addEventListener('click', () => setDrawingMode('circle'));
document.getElementById('drawArrow').addEventListener('click', () => setDrawingMode('arrow'));
document.getElementById('drawRectangle').addEventListener('click', () => setDrawingMode('rectangle'));
document.getElementById('drawCustomShape').addEventListener('click', () => setDrawingMode('customShape'));
document.getElementById('deleteAnnotation').addEventListener('click', deleteSelected);
document.getElementById('toggleBackgroundButton').addEventListener('click', toggleBackground);
document.getElementById('zoomIn').addEventListener('click', zoomIn);
document.getElementById('zoomOut').addEventListener('click', zoomOut);
// tạo table từ Id 
var table = document.getElementById('annotationTable');
table.addEventListener('click', function(event) {
    // Deselect any active object on canvas
    canvas.discardActiveObject();
    canvas.renderAll();
});
document.addEventListener('keydown', function(event) {
    if (event.shiftKey && event.key === 'l'|| event.shiftKey && event.key === 'L') {
        setDrawingMode('line');
    } else if (event.shiftKey && event.key === 'c'|| event.shiftKey && event.key === 'C') {
        setDrawingMode('circle');
    } else if (event.shiftKey && event.key === 'a'|| event.shiftKey && event.key === 'A') {
        setDrawingMode('arrow');
    } else if (event.shiftKey && event.key === 'r'|| event.shiftKey && event.key === 'R') {
        setDrawingMode('rectangle');
    } else if (event.shiftKey && event.key === 's'|| event.shiftKey && event.key === 'S') {
        setDrawingMode('customShape');
    } else if (event.key === 'Backspace') {
        deleteSelected();
    } else if (event.key === '+') {
        zoomIn();
    } else if (event.key === '-') {
        zoomOut();
    } else if (event.shiftKey && event.key === 'e'|| event.shiftKey && event.key === 'E') {
        removeEmptyRows();
    } else if (event.key === 'Delete') {
        console.log('Delete key pressed. Deleting image and shapes...');
        deleteImageAndShapes(); // Call the function
    } else if ((event.ctrlKey || event.metaKey) && (event.key === 'c' || event.key === 'C')) {
        copy();
    } else if ((event.ctrlKey || event.metaKey) && (event.key === 'v' || event.key === 'V')) {
        paste();
    } 
});
// Define an array of colors
var colors = ['white','black','red', 'blue', 'green', 'yellow', 'purple']; // màu cho đường
var colorsfill = ['white','black','red', 'blue', 'green', 'yellow', 'purple','']; // màu cho phần phía trong
var colorIndex = 0; // Chỉ số index của mảng
// short cut của việc tô màu
document.addEventListener('keydown', function(event) {
    if (event.key === 'b') {
        changeColorstroke('stroke');
    } else if (event.key === 't') {
        changeColorfill('fill');
    }
});
function changeColorstroke(property) {
    var activeObject = canvas.getActiveObject();
    if (activeObject) {
        console.log('Active Object:', activeObject);
        var shapeType = getShapeType(activeObject);
        if (shapeType) {
            switch (shapeType) {                
                case 'arrow':
                    console.log('Shape Type:', shapeType); // Check the shape type in console
                    changeColorstrokearrow();
                    break;
                case 'line':    
                case 'rectangle':
                    activeObject.set({ stroke: colors[colorIndex] });
                    break;
                case 'circle':
                case 'customShape':
                    activeObject.set({ stroke: colors[colorIndex] });
                    break;
                default:
                    break;
            }
            canvas.renderAll();
            // Increment colorIndex and wrap around if exceeding array length
            colorIndex = (colorIndex + 1) % colors.length;
        }
    }
}
function changeColorstrokearrow() {
    var activeObject = canvas.getActiveObject();
    if (activeObject && getShapeType(activeObject) === 'arrow') {
        // Assuming the arrow is a group containing lines, change stroke color for each line
        activeObject.getObjects().forEach(function(obj) {
            if (obj.type === 'line') {
                obj.set({ stroke: colors[colorIndex] });
            }
        });
        canvas.renderAll();
    }
}
function changeColorfill(property) {
    var activeObject = canvas.getActiveObject();
    if (activeObject) {
        var shapeType = getShapeType(activeObject);
        if (shapeType) {
            switch (shapeType) {
                case 'line':
                case 'arrow':
                case 'rectangle':
                    activeObject.set({ fill: colorsfill[colorIndex] });
                    break;
                case 'circle':
                case 'customShape':
                    activeObject.set({ fill: colorsfill[colorIndex] });
                    break;
                default:
                    break;
            }
            canvas.renderAll();
            // Increment colorIndex and wrap around if exceeding array length
            colorIndex = (colorIndex + 1) % colorsfill.length;
        }
    }
}
// Function to determine the type of shape (line, circle, arrow, rectangle, customShape)
function getShapeType(object) {
    if (object instanceof fabric.Line) {
        return 'line';
    } else if (object instanceof fabric.Circle) {
        return 'circle';
    } else if (object instanceof fabric.Path) {
        // Assuming customShape is a fabric.Path
        return 'customShape';
    } else if (object instanceof fabric.Rect) {
        return 'rectangle';
    } else if (object.type === 'group' && object._objects.length > 0) {
        // Check if it's an arrow (group containing lines)
        var firstChild = object._objects[0];
        if (firstChild instanceof fabric.Line) {
            return 'arrow';
        }
    }
    return null;
}
// Function to handle image upload
var imageObjects = []; // Global variable to store the current image object
//document.getElementById('imageLoader').addEventListener('change', handleImageUpload, false);
var imageUrls = new Map(); // Map to store image URLs
// Function to handle image upload
// Handle image input and add to canvas
function handleImage(e) {
    var files = e.target.files;
    for (var i = 0; i < files.length; i++) {
        var file = files[i];
        var reader = new FileReader();
        reader.onload = function(event) {
            var imageUrl = event.target.result;
            if (deletedImageUrls.has(imageUrl)) {
                // Remove the URL from the deleted image URLs set
                deletedImageUrls.delete(imageUrl);
            }
            var imgObj = new Image();
            imgObj.src = imageUrl;
            imgObj.onload = function() {
                var image = new fabric.Image(imgObj);
                image.scaleToWidth(canvas.getWidth());
                canvas.add(image);
                imageObjects.push(image);
                imageUrls.set(image, imageUrl);
                canvas.renderAll();
                e.target.value = '';
                // Set the backgroundImage on the last added image
                if (imageObjects.length === 1) {
                    canvas.setBackgroundImage(image, canvas.renderAll.bind(canvas));
                    isBackgroundSet = true;
                    console.log('Background image set:', image);
                } else {
                    console.log('Image added:', image);
                }
            };
        };
        reader.readAsDataURL(file);
    }
}
// Disable image selection and movement when in drawing mode
canvas.on('object:modified', function(event) {
    if (drawingMode) {
        var activeObject = event.target;
        if (activeObject && activeObject.type === 'image') {
            activeObject.set({
                selectable: false,
                evented: false
            });
            canvas.renderAll();
        }
    }
});

// Stack to keep track of canvas states for undo functionality
var undoStackdelete = [];
var redoStackdelete = [];

// Save the current state of the canvas and table before deletion
function saveStatedelete() {
    let state = {
        canvas: canvas.toJSON(), // Save canvas state as JSON
        table: document.getElementById('annotationTable').innerHTML,
        imageObjects: imageObjects.map(obj => ({...obj})), // Deep copy of imageObjects
        annotationMap: {...annotationMap} // Deep copy of annotationMap
    };
    undoStackdelete.push(state);
    redoStackdelete = []; // Clear redo stack after new state saved
}

// Event listener for 'Delete' key press
document.addEventListener('keydown', function(event) {
    if (event.key === 'Delete') {
        // Ask for confirmation before deleting
        if (confirm('Are you sure you want to delete the image and shapes?')) {
            console.log('Delete key pressed. Deleting image and shapes...');
            saveStatedelete(); // Save the current state before deletion
            deleteImageAndShapes(); // Call the function
        } else {
            console.log('Deletion canceled by user.');
            return; // Exit the function without performing deletion
        }
    }
});

// Function to delete images and shapes
function deleteImageAndShapes() {
    // Remove all image objects from the canvas
    if (imageObjects.length > 0) {
        imageObjects.forEach(function(imageObject) {
            canvas.remove(imageObject);
        });
        imageObjects = []; // Clear the array of image objects
    } else {
        console.warn('No image objects found to delete.');
    }
    
    // Remove the background image if it is set
    if (canvas.backgroundImage) {
        canvas.setBackgroundImage(null, canvas.renderAll.bind(canvas));
        console.log('Background image removed');
    } else {
        console.warn('No background image found to delete.');
    }
    
    // Remove all shapes from the canvas except images
    var objectsToRemove = [];
    canvas.getObjects().forEach(obj => {
        if (obj.type !== 'image') {
            objectsToRemove.push(obj);
        }
    });

    objectsToRemove.forEach(obj => {
        canvas.remove(obj);
    });
    
    // Clear any associated data or arrays tracking shapes (optional)
    clearAnnotationData(); 
    
    // Update your UI or perform any other necessary actions
    canvas.renderAll(); // Render the canvas after removal
    
    // Delete all rows from the table
    deleteAllTableRows(); // Call function to delete all table rows
}

// Function to clear annotation data
function clearAnnotationData() {
    // Implement your logic to clear any associated data here
    annotationMap = {}; // Clear the annotation map or any other data structures
    // Other cleanup tasks specific to your application
}

// Function to delete all table rows
function deleteAllTableRows() {   
    var table = document.getElementById('annotationTable');
    if (table) {
        // Remove all rows except the header row
        while (table.rows.length > 1) {
            table.deleteRow(1); // Start deleting from index 1 (first row after header)
        }
    } else {
        console.warn('Table not found.');
    }
}

// Function to undo the delete operation
function undoDeleteImageAndShapes() {
    if (undoStackdelete.length === 0) {
        console.warn('No actions to undo.');
        return;
    }

    let lastState = undoStackdelete.pop();
    redoStackdelete.push({
        canvas: canvas.toJSON(),
        table: document.getElementById('annotationTable').innerHTML,
        annotationMap: {...annotationMap}
    });

    // Attempt to restore the canvas state
    try {
        canvas.loadFromJSON(lastState.canvas, function() {
            // After loading JSON state
            canvas.renderAll(); // Render the canvas after loading state

            // Restore the table state
            document.getElementById('annotationTable').innerHTML = lastState.table;

            // Restore the annotation map
            annotationMap = lastState.annotationMap;

            console.log('Undo successful.');
        });

    } catch (error) {
        console.error('Error during undo:', error);
    }
}


// Event listener for 'Ctrl+Z' key press to trigger undo
document.addEventListener('keydown', function(event) {
    if ( event.key === 'z') {
        console.log('Ctrl+Z pressed. Undoing last action...');
        undoDeleteImageAndShapes(); // Call the undo function
    }
});

// Assuming you have a key listener or a button click event to trigger this function
// Function to copy selected object
function copy() {
    canvas.getActiveObject().clone(function(cloned) {
        _clipboard = cloned;
    });
}

// Function to paste copied object
function paste() {
    if (_clipboard) {
        _clipboard.clone(function(clonedObj) {
            canvas.discardActiveObject();
            clonedObj.set({
                left: clonedObj.left + 10, // Adjust paste position as needed
                top: clonedObj.top + 10,
                evented: true,
            });
            if (clonedObj.type === 'activeSelection') {
                // active selection needs a reference to the canvas.
                clonedObj.canvas = canvas;
                clonedObj.forEachObject(function(obj) {
                    canvas.add(obj);
                });
                clonedObj.setCoords();
            } else {
                canvas.add(clonedObj);
            }
            addNewAnnotation(clonedObj);
            _clipboard.top += 10;
            _clipboard.left += 10;
            canvas.setActiveObject(clonedObj);
            canvas.requestRenderAll();
        });
    }
}
function drawLine() {
    var line, isDown;

    function handleMouseDown(o) {
        if (drawingMode !== 'line') return;
        var pointer = canvas.getPointer(o.e);

        // Check if clicking on an image
        var target = canvas.findTarget(o.e, false);
        if (target && target.type === 'image') {
            return; // Ignore drawing lines when clicking on an image
        }

        isDown = true;
        var points = [pointer.x, pointer.y, pointer.x, pointer.y];
        line = new fabric.Line(points, {
            strokeWidth: 2,
            fill: 'red',
            stroke: 'red',
            originX: 'center',
            originY: 'center',
            selectable: false, // Temporarily set to false while drawing
            hasControls: true,
            hasBorders: true,
        });
        canvas.add(line);
        canvas.bringToFront(line); // Ensure the line is brought to the front
    }

    function handleMouseMove(o) {
        if (!isDown || drawingMode !== 'line') return;
        var pointer = canvas.getPointer(o.e);
        line.set({ x2: pointer.x, y2: pointer.y });
        canvas.renderAll();
    }

    function handleMouseUp(o) {
        if (!isDown || drawingMode !== 'line') return;
        isDown = false;

        // Ensure the line is selectable after drawing
        line.set({
            selectable: true,
            evented: true, // Ensure the line can receive events
        });
        line.setCoords(); // Update the line's coordinates

        // Add the annotation row
        //addAnnotationRow(currentNumber);
        annotationMap[currentNumber] = line;
        setDrawingMode(null);

        canvas.off('mouse:down', handleMouseDown);
        canvas.off('mouse:move', handleMouseMove);
        canvas.off('mouse:up', handleMouseUp);

        canvas.renderAll();
    }

    canvas.on('mouse:down', handleMouseDown);
    canvas.on('mouse:move', handleMouseMove);
    canvas.on('mouse:up', handleMouseUp);
}

function addNewAnnotation(object) {
    var newNumber = getLargestNumber() + 1;
    addAnnotationRow(newNumber);
    addNumberLabel(newNumber, object);
    annotationMap[newNumber] = object;
    setDrawingMode(null);
}

function drawArrow() {
    var arrow, arrowHead1, arrowHead2, isDown, startX, startY;

    canvas.on('mouse:down', function(o) {
        if (drawingMode !== 'arrow') return;
        isDown = true;
        var pointer = canvas.getPointer(o.e);
        startX = pointer.x;
        startY = pointer.y;
        arrow = new fabric.Line([startX, startY, startX, startY], {
            strokeWidth: 2,
            fill: 'red',
            stroke: 'red',
            selectable: true,
            originX: 'center',
            originY: 'center'
        });
        canvas.add(arrow);
    });

    canvas.on('mouse:move', function(o) {
        if (!isDown || drawingMode !== 'arrow') return;
        var pointer = canvas.getPointer(o.e);
        arrow.set({ x2: pointer.x, y2: pointer.y });
        canvas.renderAll();
    });

    canvas.on('mouse:up', function(o) {
        if (!isDown || drawingMode !== 'arrow') return;
        isDown = false;

        // Add arrowhead
        var endX = arrow.x2;
        var endY = arrow.y2;
        var angle = Math.atan2(endY - startY, endX - startX);
        var headLength = 10;

        arrowHead1 = new fabric.Line([
            endX,
            endY,
            endX - headLength * Math.cos(angle - Math.PI / 6),
            endY - headLength * Math.sin(angle - Math.PI / 6)
        ], {
            strokeWidth: 2,
            fill: 'red',
            stroke: 'red',
            selectable: true,
            originX: 'center',
            originY: 'center'
        });

        arrowHead2 = new fabric.Line([
            endX,
            endY,
            endX - headLength * Math.cos(angle + Math.PI / 6),
            endY - headLength * Math.sin(angle + Math.PI / 6)
        ], {
            strokeWidth: 2,
            fill: 'red',
            stroke: 'red',
            selectable: true,
            originX: 'center',
            originY: 'center'
        });

        var arrowGroup = new fabric.Group([arrow, arrowHead1, arrowHead2], {
            selectable: true,
            originX: 'center',
            originY: 'center'
        });

        canvas.add(arrowGroup);
        canvas.remove(arrow);
        canvas.remove(arrowHead1);
        canvas.remove(arrowHead2);

        currentNumber = getLargestNumber() + 1;
        addAnnotationRow(currentNumber);
        addNumberLabel(currentNumber, arrowGroup);
        annotationMap[currentNumber] = arrowGroup;
        setDrawingMode(null);
    });
}
function drawCircle() {
    var circle, isDown;

    function handleMouseDown(o) {
        if (drawingMode !== 'circle') return;
        isDown = true;
        var pointer = canvas.getPointer(o.e);
        circle = new fabric.Circle({
            left: pointer.x,
            top: pointer.y,
            originX: 'center',
            originY: 'center',
            radius: 1,
            fill: 'rgba(0,0,0,0)',
            stroke: 'red',
            strokeWidth: 2,
            selectable: false, // Temporarily set to false while drawing
            hasControls: true,
            hasBorders: true,
        });
        canvas.add(circle);
        circle.bringToFront();
    }

    function handleMouseMove(o) {
        if (!isDown || drawingMode !== 'circle') return;
        var pointer = canvas.getPointer(o.e);
        var radius = Math.sqrt(Math.pow(circle.left - pointer.x, 2) + Math.pow(circle.top - pointer.y, 2));
        circle.set({ radius: radius });
        canvas.renderAll();
    }

    function handleMouseUp(o) {
        if (!isDown || drawingMode !== 'circle') return;
        isDown = false;

        // Ensure the circle is selectable after drawing
        circle.set({
            selectable: true,
            evented: true, // Ensure the circle can receive events
        });
        circle.setCoords(); // Update the circle's coordinates

        // Add the annotation row
        //addAnnotationRow(currentNumber);
        annotationMap[currentNumber] = circle;
        setDrawingMode(null);

        // Cleanup event listeners
        canvas.off('mouse:down', handleMouseDown);
        canvas.off('mouse:move', handleMouseMove);
        canvas.off('mouse:up', handleMouseUp);

        canvas.renderAll();
    }

    // Attach event listeners
    canvas.on('mouse:down', handleMouseDown);
    canvas.on('mouse:move', handleMouseMove);
    canvas.on('mouse:up', handleMouseUp);
}
function drawRectangle() {
    var rect, isDown, origX, origY;

    function handleMouseDown(o) {
        if (drawingMode !== 'rectangle') return;
        isDown = true;
        var pointer = canvas.getPointer(o.e);
        origX = pointer.x;
        origY = pointer.y;
        rect = new fabric.Rect({
            left: origX,
            top: origY,
            originX: 'left',
            originY: 'top',
            width: pointer.x - origX,
            height: pointer.y - origY,
            angle: 0,
            fill: 'rgba(0,0,0,0)',
            stroke: 'red',
            strokeWidth: 2,
            selectable: false, // Temporarily set to false while drawing
            hasControls: true,
            hasBorders: true,
        });
        canvas.add(rect);
        rect.bringToFront();
    }

    function handleMouseMove(o) {
        if (!isDown || drawingMode !== 'rectangle') return;
        var pointer = canvas.getPointer(o.e);
        if (origX > pointer.x) {
            rect.set({ left: Math.abs(pointer.x) });
        }
        if (origY > pointer.y) {
            rect.set({ top: Math.abs(pointer.y) });
        }
        rect.set({
            width: Math.abs(origX - pointer.x),
            height: Math.abs(origY - pointer.y)
        });
        canvas.renderAll();
    }

    function handleMouseUp(o) {
        if (!isDown || drawingMode !== 'rectangle') return;
        isDown = false;

        // Ensure the rectangle is selectable after drawing
        rect.set({
            selectable: true,
            evented: true, // Ensure the rectangle can receive events
        });
        rect.setCoords(); // Update the rectangle's coordinates

        // Add the annotation row
        //addAnnotationRow(currentNumber);
        annotationMap[currentNumber] = rect;
        setDrawingMode(null);

        // Cleanup event listeners
        canvas.off('mouse:down', handleMouseDown);
        canvas.off('mouse:move', handleMouseMove);
        canvas.off('mouse:up', handleMouseUp);

        canvas.renderAll();
    }

    // Attach event listeners
    canvas.on('mouse:down', handleMouseDown);
    canvas.on('mouse:move', handleMouseMove);
    canvas.on('mouse:up', handleMouseUp);
}

function drawCustomShape() {
    var isDrawing = false;
    var path = [];
    var tempPath;

    function handleMouseDown(o) {
        if (drawingMode !== 'customShape') return;
        isDrawing = true;
        var pointer = canvas.getPointer(o.e);
        path = [['M', pointer.x, pointer.y]];
    }

    function handleMouseMove(o) {
        if (!isDrawing || drawingMode !== 'customShape') return;
        var pointer = canvas.getPointer(o.e);
        path.push(['L', pointer.x, pointer.y]);

        // Clear temporary path if it exists
        if (tempPath) {
            canvas.remove(tempPath);
        }

        // Create a new temporary path
        tempPath = new fabric.Path(path, {
            stroke: 'red',
            fill: 'rgba(0,0,0,0)',
            strokeWidth: 2,
            selectable: false,
            evented: false
        });

        canvas.add(tempPath);
        canvas.renderAll();
    }

    function handleMouseUp(o) {
        if (!isDrawing || drawingMode !== 'customShape') return;
        isDrawing = false;

        // Create the final path from the collected points
        var customShape = new fabric.Path(path, {
            stroke: 'red',
            fill: 'rgba(0,0,0,0)',
            strokeWidth: 2,
            selectable: true,
            evented: true // Ensure the shape can receive events
        });

        canvas.add(customShape);
        if (tempPath) {
            canvas.remove(tempPath); // Remove the temporary path
        }

        // Add the annotation row
        //addAnnotationRow(currentNumber);
        annotationMap[currentNumber] = customShape;
        setDrawingMode(null);

        // Cleanup event listeners
        canvas.off('mouse:down', handleMouseDown);
        canvas.off('mouse:move', handleMouseMove);
        canvas.off('mouse:up', handleMouseUp);

        canvas.renderAll();
    }

    // Attach event listeners
    canvas.on('mouse:down', handleMouseDown);
    canvas.on('mouse:move', handleMouseMove);
    canvas.on('mouse:up', handleMouseUp);
}
//var deletedObjects = [];
//var imageUrls = new Map(); // Assuming you store image URLs in a Map with image object as the key
// Stacks to store history for undo and redo
var deletedObjects = [];
var undoStack = [];
var redoStack = [];

// Function to get the current state including annotations and table rows
function getCurrentState() {
    return {
        canvas: JSON.stringify(canvas.toJSON()),
        annotationMap: JSON.stringify(annotationMap),
        tableRows: document.getElementById('annotationTable').innerHTML
    };
}

// Function to save the current state to the undo stack
function saveState() {
    undoStack.push(getCurrentState());
    redoStack = []; // Clear redo stack when a new action is performed
}

function deleteSelected() {
    var activeObjects = canvas.getActiveObjects();
    if (activeObjects.length) {
        var deletedItems = {
            objects: [],
            annotations: {}
        };
        
        activeObjects.forEach(function(activeObject) {
            if (activeObject.type === 'image') {
                console.log('Skipped deletion of image:', activeObject);
            } else {
                var number = parseInt(activeObject.text?.text); // Use optional chaining to avoid errors
                
                // Store the object and its annotation before deleting
                deletedItems.objects.push({
                    object: activeObject,
                    number: number
                });

                if (annotationMap[number]) {
                    deletedItems.annotations[number] = annotationMap[number];
                }

                // Remove the shape object from the canvas
                canvas.remove(activeObject);

                // Handle annotations associated with the shape
                if (number && annotationMap[number]) {
                    removeAnnotationText(number);
                    deleteAnnotationText(number);
                    delete annotationMap[number];
                }
                deleteAnnotationRow(number);
            }
        });

        // Store the deleted items in the deletedObjects array
        deletedObjects.push(deletedItems);

        saveState(); // Save the current state

        canvas.discardActiveObject();
        canvas.renderAll();
    }
}


function undoDelete() {
    if (deletedObjects.length > 0) {
        var lastDeleted = deletedObjects.pop(); // Retrieve the last deleted items

        // Restore the objects to the canvas
        lastDeleted.objects.forEach(function(item) {
            canvas.add(item.object);
        });

        // Restore the annotations
        for (var number in lastDeleted.annotations) {
            var annotationData = lastDeleted.annotations[number];
            annotationMap[number] = annotationData;
            addAnnotationRow(number);
            addNumberLabel(number, annotationData);
        }

        // Re-sort the table if needed
        sortTable();

        canvas.renderAll();

        // Save the current state after undo
        saveState();
    } else {
        console.log('No objects to undo.');
    }
}

// Event listener for keydown
document.addEventListener('keydown', function(e) {
    if (e.ctrlKey && e.key === 'z') {
        undoDelete();
    } 
});
// Function to remove annotation text
function removeAnnotationText(number) {
    if (annotationMap[number] && annotationMap[number].text) {
        canvas.remove(annotationMap[number].text);
    }
}

// Function to zoom in
function zoomIn() {
    var zoomLevel = canvas.getZoom();
    zoomLevel += 0.1;
    canvas.setZoom(zoomLevel);
}

// Function to zoom out
function zoomOut() {
    var zoomLevel = canvas.getZoom();
    zoomLevel -= 0.1;
    if (zoomLevel < 0.1) zoomLevel = 0.1;
    canvas.setZoom(zoomLevel);
}
// Function to lock/unlock a specific annotation shape
function lockShape(number, lock) {
    var shape = annotationMap[number];
    if (shape) {
        shape.selectable = !lock;
        shape.evented = !lock;
        canvas.renderAll();
    }
}

// Updated lockImages function to iterate over all annotation shapes
function lockImages(lock) {
    for (var number in annotationMap) {
        if (annotationMap.hasOwnProperty(number)) {
            lockShape(number, lock);
        }
    }
    images.forEach(img => {
        img.selectable = !lock;
        img.evented = !lock;
    });
    canvas.renderAll();
}


// Function to reset canvas event listeners based on drawing mode
function resetCanvasListeners() {
    canvas.off('mouse:down');
    canvas.off('mouse:move');
    canvas.off('mouse:up');
    if (drawingMode === 'line') {
        drawLine();
    } else if (drawingMode === 'circle') {
        drawCircle();
    } else if (drawingMode === 'arrow') {
        drawArrow();
    } else if (drawingMode === 'rectangle') {
        drawRectangle();
    } else if (drawingMode === 'customShape') {
        drawCustomShape();
    }
}

// Function to get the largest annotation number
function getLargestNumber() {
    var largest = 0;
    var table = document.getElementById('annotationTable').getElementsByTagName('tbody')[0];
    for (var i = 0, row; row = table.rows[i]; i++) {
        var value = parseInt(row.cells[0].getElementsByTagName('input')[0].value);
        if (value > largest) {
            largest = value;
        }
    }
    return largest;
}

// Function to add a new row in the annotation table
function addAnnotationRow(number) {
    var table = document.getElementById('annotationTable').getElementsByTagName('tbody')[0];
    var newRow = table.insertRow();

    var cell1 = newRow.insertCell(0);
    var cell2 = newRow.insertCell(1);
    var cell3 = newRow.insertCell(2);

    cell1.innerHTML = `<input type="number" id="annotationInput${number}" value="${number}" onchange="updateAnnotationNumber(${number}, this.value)">`;
    cell2.innerHTML = `<input type="text" id="description${number}" value="" onchange="updateAnnotationDescription(${number}, this.value)">`;
    cell3.innerHTML = `<input type="text" id="color${number}" value="" onchange="updateAnnotationColor(${number}, this.value)">`;

    sortTable(); // Sort the table after adding a new row
}

// Function to delete a row from the annotation table
function deleteAnnotationRow(number) {
    var table = document.getElementById('annotationTable').getElementsByTagName('tbody')[0];
    for (var i = 0, row; row = table.rows[i]; i++) {
        if (parseInt(row.cells[0].getElementsByTagName('input')[0].value) === number) {
            table.deleteRow(i);
            break;
        }
    }
}
// Function to update annotation number
function updateAnnotationNumber(oldNumber, newNumber) {
    canvas.discardActiveObject();
    
    // Convert newNumber to integer
    newNumber = parseInt(newNumber);

    // Check if newNumber already exists
    if (newNumber in annotationMap) {
        alert("Number already exists.");
        // Revert back to old number if new number already exists
        updateTableRowNumber(newNumber, oldNumber);
        // Sort the table again after reverting
        sortTable();
        return;
    }
    
    // Get the annotation object associated with oldNumber
    var annotation = annotationMap[oldNumber];
    // If annotation exists, update annotationMap and associated properties
    if (annotation) {
        annotationMap[newNumber] = annotation;
        delete annotationMap[oldNumber];
        // Update text on the canvas object
        var text = annotation.text;
        text.set({ text: String(newNumber) });
        canvas.renderAll();
    }
    // Update the table row number and sort the table
    updateTableRowNumber(oldNumber, newNumber);
    sortTable();
    // Update the onchange attribute to reflect the new number
    var inputElement = document.getElementById('annotationInput' + oldNumber);
    if (inputElement) {
        inputElement.setAttribute('onchange', `updateAnnotationNumber(${newNumber}, this.value)`);
        inputElement.id = 'annotationInput' + newNumber; // Update the ID as well
    }
}
var backgroundImage = null;
var isBackgroundSet = false;
// Function to toggle background image
function toggleBackground() {
    console.log('Toggle background called');
    if (backgroundImage) {
        // Remove background and add the background image back as an object
        canvas.setBackgroundImage(null, canvas.renderAll.bind(canvas));
        canvas.add(backgroundImage);
        imageObjects.push(backgroundImage);
        backgroundImage.set({ selectable: true, evented: true });
        backgroundImage = null;
        isBackgroundSet = false;
        console.log('Background removed. isBackgroundSet:', isBackgroundSet);
    } else if (imageObjects.length > 0) {
        // Set the last image as background
        const lastImage = imageObjects.pop();
        backgroundImage = lastImage;
        canvas.remove(lastImage);
        canvas.setBackgroundImage(lastImage, canvas.renderAll.bind(canvas));
        backgroundImage.set({ selectable: false, evented: false });
        isBackgroundSet = true;
        console.log('Background set. isBackgroundSet:', isBackgroundSet);
    } else {
        console.log('No image to toggle');
    }
    canvas.renderAll();
}
// Function to update annotation number in table row
function updateTableRowNumber(oldNumber, newNumber) {
    var table = document.getElementById('annotationTable').getElementsByTagName('tbody')[0];
    for (var i = 0, row; row = table.rows[i]; i++) {
        if (parseInt(row.cells[0].getElementsByTagName('input')[0].value) === oldNumber) {
            row.cells[0].getElementsByTagName('input')[0].value = newNumber;
            break;
        }
    }
}
// Function to sort annotation table rows
function sortTable() {
    var table = document.getElementById('annotationTable').getElementsByTagName('tbody')[0];
    var rows = Array.from(table.rows);
    rows.sort((a, b) => parseInt(a.cells[0].getElementsByTagName('input')[0].value) - parseInt(b.cells[0].getElementsByTagName('input')[0].value));
    rows.forEach(row => table.appendChild(row));
}
// Function to add number label associated with an annotation object
function addNumberLabel(number, obj) {
    if (number === null) return;
    console.log("Adding text object:", text);
    // Calculate the position relative to the line object
    var labelLeft = obj.left;
    var labelTop = obj.top - 10; // Adjust as needed
    var text = new fabric.Text(String(number), {
        left: labelLeft,
        top: labelTop,
        fontSize: 16,
        fill: 'red',
        selectable: false,
        evented: false
    });
    obj.text = text;
    canvas.add(text);
    canvas.bringToFront(text);
    // Optionally, bring the line object to the front as well
    canvas.bringToFront(obj);
    canvas.renderAll();
}
// Event listener for updating number label positions when objects are moved, scaled, or rotated
canvas.on('object:moved', updateNumberLabelPosition);
canvas.on('object:scaling', updateNumberLabelPosition);
canvas.on('object:rotated', updateNumberLabelPosition);

// Function to update number label position based on object movement, scaling, or rotation
function updateNumberLabelPosition(e) {
    var obj = e.target;
    if (obj.text) {
        obj.text.set({
            left: obj.left,
            top: obj.top - 10
        });
        canvas.renderAll();
    }
}

// Function to remove rows without number column values and corresponding shapes with NaN labels
function removeEmptyRows() {
    var table = document.getElementById('annotationTable').getElementsByTagName('tbody')[0];
    
    for (var i = table.rows.length - 1; i >= 0; i--) {
        var inputElement = table.rows[i].cells[0].getElementsByTagName('input')[0];
        var value = parseInt(inputElement.value);
        
        if (isNaN(value)) {
            // Remove corresponding shape from canvas and its associated text label
            var shapeToRemove = annotationMap[value];
            if (shapeToRemove) {
                canvas.remove(shapeToRemove);
                delete annotationMap[value];
                deleteAnnotationText(shapeToRemove); // Delete associated text label
            }
            // Delete row from table regardless of NaN label
            table.deleteRow(i);
        }
    }
    canvas.renderAll();
}

// Function to delete annotation text label associated with a shape
function deleteAnnotationText(shape) {
    if (shape.text) {
        canvas.remove(shape.text);
    }
}

// Initialize drawing functionalities
drawLine();
drawArrow();
drawCircle();
drawRectangle();
drawCustomShape();
function updateAnnotationDescription(number, description) {
    canvas.discardActiveObject();
    // Custom logic to handle description updates
    console.log(`Annotation ${number} description updated to: ${description}`);
}

function updateAnnotationColor(number, color) {
    canvas.discardActiveObject();
    // Custom logic to handle color updates
    console.log(`Annotation ${number} color updated to: ${color}`);
}
// Initialize history array

// Save state on every modification
canvas.on('object:added', saveState);
canvas.on('object:modified', saveState);
canvas.on('object:removed', saveState);
// function to export file in Pdf and excel
const exportExcelButton = document.getElementById('exportExcel');
exportExcelButton.addEventListener('click', exportToExcel);

function exportToExcel() {
    console.log("Starting export to Excel...");

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Annotations and Canvas');

    // Add annotations table to Excel
    worksheet.addRow(['Số thứ tự', 'Thông tin mô tả', 'Chất liệu']);
    const rows = annotationTable.querySelectorAll('tbody tr');
    rows.forEach(row => {
        console.log("Processing row:", row.innerHTML); // Log the HTML of each row to inspect its structure
        try {
            const numberInput = row.querySelector('input[type="number"]');
            const descriptionInput = row.querySelector('input[type="text"]:first-of-type');
            const colorInput = row.querySelector('input[type="text"]:last-of-type');

            if (!numberInput || !descriptionInput || !colorInput) {
                console.error("Error finding inputs in row:", row);
                return;
            }

            const number = numberInput.value;
            const description = descriptionInput.value;
            const color = colorInput.value;

            const rowData = [number, description, color];
            console.log("Adding row to Annotations sheet:", rowData);
            worksheet.addRow(rowData);
        } catch (error) {
            console.error("Error processing row:", row, error);
        }
    });

    // Leave a gap between annotations and canvas image
    const lastAnnotationRow = worksheet.lastRow.number;
    worksheet.getRow(lastAnnotationRow + 1).getCell(1).value = '';
    worksheet.getRow(lastAnnotationRow + 2).getCell(1).value = 'Canvas Image';

    // Add canvas image to Excel
    const canvasImage = canvas.toDataURL('image/png').replace(/^data:image\/png;base64,/, '');
    const imageId = workbook.addImage({
        base64: canvasImage,
        extension: 'png',
    });
    const imageRow = lastAnnotationRow + 3;
    worksheet.addImage(imageId, {
        tl: { col: 1, row: imageRow },
        ext: { width: 400, height: 300 } // Adjust dimensions as needed
    });
    console.log("Adding canvas image to Excel");
    /*
    // Leave a gap between canvas image and shapes
    const lastImageRow = imageRow + 20; // Adjust based on image size
    worksheet.getRow(lastImageRow + 1).getCell(1).value = '';
    worksheet.getRow(lastImageRow + 2).getCell(1).value = 'Shapes and Labels';
    worksheet.getRow(lastImageRow + 3).getCell(1).value = 'Shape';
    worksheet.getRow(lastImageRow + 3).getCell(2).value = 'Label';

    // Add shapes and labels to Excel
    Object.values(annotationMap).forEach(shape => {
        const label = shape.text ? shape.text.text : '';
        const shapeData = ['Circle', label]; // Adjust as per your shape types
        console.log("Adding shape to Shapes sheet:", shapeData);
        worksheet.addRow(shapeData);
    });
*/
    // Save workbook as an Excel file
    console.log("Saving workbook as annotations.xlsx...");
    workbook.xlsx.writeBuffer().then(buffer => {
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'annotations.xlsx';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        console.log("Export to Excel complete.");
    });
}
