let ismdwn = 0;

function registerResize(id, mVCallback) {
    document
        .getElementById(id)
        .addEventListener('mousedown', mD);

    function mD(event) {
        ismdwn = 1;
        document
            .body
            .addEventListener('mousemove', mV);
        document
            .body
            .addEventListener('mouseup', end);
    }

    function mV(event) {
        if (ismdwn === 1) {
            if (mVCallback) {
                mVCallback(event);
            }
        } else {
            end();
        }
    }

    function end(e) {
        ismdwn = 0;
        document
            .body
            .removeEventListener('mouseup', end);
        document
            .body
            .removeEventListener('mousemove', mV);
    }
}

registerResize('edit-resize', (event) => {
    document
        .getElementById('render-container')
        .style
        .flexBasis = event.clientX + "px";
    document
        .getElementById('animate-tool')
        .style
        .left = event.clientX + "px";
});

registerResize('terminal-resize', (event) => {
    // document
    //     .getElementById('editor')
    //     .style
    //     .flexBasis = event.clientY - document
    //     .getElementsByClassName('menu')[0]
    //     .clientHeight + "px";
    document.getElementById('terminal-resize').style.bottom = window.innerHeight - event.clientY + "px";
    document.getElementById('terminal').style.height = window.innerHeight - event.clientY + "px";
    document.getElementById('edit-input').style.marginBottom = window.innerHeight - event.clientY + "px";
});