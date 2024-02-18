async function processVideo() {
    const fileInput = document.getElementById("videoFile");
    const videoFile = fileInput.files[0];

    const formData = new FormData();
    formData.append("file", videoFile);

    document.getElementById("videoButton").style.display = "none";
    document.getElementById("error").innerText = "Loading...";

    try {
        const response = await fetch(
            "https://dotindex.pythonanywhere.com/process_video",
            {
                method: "POST",
                body: formData,
            }
        );

        if (!response.ok) {
            document.getElementById("error").innerText = await response.text();
            throw new Error("Error processing video");
        }

        const processedFile = await response.blob();
        const downloadLink = URL.createObjectURL(processedFile);

        const link = document.createElement("a");
        link.href = downloadLink;
        link.download = `${Math.floor(Date.now() / 1000)}.level`;
        link.click();
        document.getElementById("error").innerText = "Success";


        URL.revokeObjectURL(downloadLink);
    } catch (error) {
        console.error(error);
    }
    document.getElementById("videoButton").style.display = "flex";
}

document.getElementById("videoButton").addEventListener("click", () => {
    processVideo();
})