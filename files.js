let webusb = null;
let adb = null;
let shell = null;
let sync = null;

async function connectUsb() {
    try {
        webusb = await Adb.open("WebUSB");
        adb = await webusb.connectAdb("host::");
    } catch (e) { console.log(e); }
    if (adb != null) {
        alert("Success! (If headset sleeps, it worked.)");
        shell = await adb.shell(`input keyevent KEYCODE_SLEEP`);
    }
}
async function listQuestLevels() {
    shell = await adb.shell(`ls /sdcard/Android/data/com.slindev.grab_demo/files/levels/user/`);
    let r = await shell.receive();
    let directoryListing = decoder.decode(r.data);

    let container = document.getElementById('levels-container');
    container.innerHTML = '';
    let levels = directoryListing.replaceAll(" ", "").replaceAll("\n", "").split('.level');
    levels.forEach(level => {
        if (level != '') {
            let levelElement = document.createElement('div');
            levelElement.classList.add('level');
            levelElement.innerText = level+".level";
            levelElement.addEventListener('click', () => {
                openQuestLevel(level+".level");
            });
            console.log(level+".level");
            container.appendChild(levelElement);
        }
    });
}
async function saveToQuest(name=(Date.now()).toString().slice(0, -3)) {
    let obj = getLevel();
    let {root} = protobuf.parse(PROTOBUF_DATA, { keepCase: true });
    let message = root.lookupType("COD.Level.Level");
    let errMsg = message.verify(obj);
    if(errMsg) {throw Error(errMsg)};
    let buffer = message.encode(message.fromObject(obj)).finish();
    
    let blob = new Blob([buffer], {type: "application/octet-stream"});
    let file = new File([blob], name+".level");
    
    sync = await adb.sync();
    let push_dest = `/sdcard/Android/data/com.slindev.grab_demo/files/levels/user/${file.name}`;
    await sync.push(file, push_dest, "0644");
    await sync.quit();
    sync = null;
    alert("Success!");
}
connectUsb();
listQuestLevels();