let adb;
let webusb;
let decoder = new TextDecoder();
let input = document.getElementById("input");

let init = async () => {
    webusb = await Adb.open("WebUSB");
};

let connect = async () => {
    if (webusb.isAdb()) {
        try {
            adb = null;
            adb = await webusb.connectAdb("host::", () => {
                console.log(
                    "Please check the screen of your " + webusb.device.productName + "."
                );
            });
        } catch (error) {
            console.error(error);
            adb = null;
        }
    }
};

let disconnect = async () => {
    webusb.close();
};

let pull = async (filename) => {
    let sync = await adb.sync();
    let content = await sync.pull(filename);

    await sync.quit();

    return content;
};

let push = async (content, filename) => {
    let sync = await adb.sync();
    await sync.push(content, filename, "0777");

    await sync.quit();
}

let download = async (filename) => {
    let data = await pull(filename);
    let a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([data]));
    a.download = filename.replaceAll("\\", "/").split("/").pop();
    a.click();
};

let list = async (folder) => {
    let sync = await adb.sync();
    let shell = await adb.shell(`ls -l ${folder}`);
    let r = await shell.receive();
    let files = decoder.decode(r.data);

    await sync.quit();

    return files;
};

let test = async () => {
    await init();
    await connect();
    let files = input.files;
    for (let i = 0; i < files.length; i++) {
        await push(files[i], "sdcard/Download/"+files[i].name);
    }
    
    await disconnect();
};

input.onchange = test;
