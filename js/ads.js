let adsEnabled = true;

let adOptions = [
    {
        "title": "Advertisement",
        "body": "SPC Battery Head Strap for Quest 3",
        "link": "https://www.kiwidesign.com/products/spc-battery-head-strap-for-quest-3?ref=uyilprxj",
        "image": "https://goaffpro-product-images.b-cdn.net/aHR0cHM6Ly93d3cua2l3aWRlc2lnbi5jb20vY2RuL3Nob3AvZmlsZXMvS0lXSWRlc2lnbl9TUENfYmF0dGVyeV9oZWFkX3N0cmFwX2Zvcl9tZXRhX3F1ZXN0XzNfOS5wbmc=?optimiser=image",
        "source": "KIWI Design"
    },
    {
        "title": "Advertisement",
        "body": "Battery Head Strap for Quest 3",
        "link": "https://www.kiwidesign.com/products/battery-head-strap-for-quest-3?ref=uyilprxj",
        "image": "https://goaffpro-product-images.b-cdn.net/aHR0cHM6Ly93d3cua2l3aWRlc2lnbi5jb20vY2RuL3Nob3AvZmlsZXMvS0lXSWRlc2lnbl9iYXR0ZXJ5X2hlYWRfc3RyYXBfZm9yX21ldGFfcXVlc3RfM18wLnBuZw==?optimiser=image",
        "source": "KIWI Design"
    },
    {
        "title": "Advertisement",
        "body": "Knuckle Grips with Battery Opening for Quest 3",
        "link": "https://www.kiwidesign.com/collections/controller-grips-cover-for-quest-3/products/knuckle-grips-cover-with-battery-opening-for-quest-3?ref=uyilprxj",
        "image": "https://goaffpro-product-images.b-cdn.net/aHR0cHM6Ly93d3cua2l3aWRlc2lnbi5jb20vY2RuL3Nob3AvZmlsZXMvS0lXSWRlc2lnbl9LbnVja2xlX2dyaXBzX2JhdHRlcnlfb3BlbmluZ19mb3JfUXVlc3QzXzAucG5n?optimiser=image",
        "source": "KIWI Design"
    },
    {
        "title": "Advertisement",
        "body": "Knuckle Controller Grips Cover for Quest 3",
        "link": "https://www.kiwidesign.com/collections/controller-grips-cover-for-quest-3/products/knuckle-controller-grips-cover-for-with-quest-3?ref=uyilprxj",
        "image": "https://goaffpro-product-images.b-cdn.net/aHR0cHM6Ly93d3cua2l3aWRlc2lnbi5jb20vY2RuL3Nob3AvZmlsZXMvS0lXSWRlc2lnbl9rbnVja2xlX2dyaXBzX1F1ZXN0M18xMC5wbmc=?optimiser=image",
        "source": "KIWI Design"
    },
    {
        "title": "Advertisement",
        "body": "16FT Accessory Compatible Link Cable for Quest 2",
        "link": "https://www.kiwidesign.com/collections/link-cable/products/link-cable-16ft-compatible-with-quest-2-with-cable-clip-accessories?ref=uyilprxj",
        "image": "https://goaffpro-product-images.b-cdn.net/aHR0cHM6Ly93d3cua2l3aWRlc2lnbi5jb20vY2RuL3Nob3AvcHJvZHVjdHMvS0lXSWRlc2lnbl9saW5rX2NhYmxlXzIuanBn?optimiser=image",
        "source": "KIWI Design"
    },
    {
        "title": "Advertisement",
        "body": "Link Cable Accessories Compatible with Quest 3/2",
        "link": "https://www.kiwidesign.com/collections/link-cable/products/link-cable-compatible-with-quest-3?ref=uyilprxj",
        "image": "https://goaffpro-product-images.b-cdn.net/aHR0cHM6Ly93d3cua2l3aWRlc2lnbi5jb20vY2RuL3Nob3AvZmlsZXMvS0lXSWRlc2lnbl8xNkZUX2NhYmxlbGlua18wLmpwZw==?optimiser=image",
        "source": "KIWI Design"
    },
    {
        "title": "Advertisement :3",
        "body": "Rahhhh an ad!!111! :333 :3 :3 LINK CABLE :O :3",
        "link": "https://www.kiwidesign.com/collections/link-cable/products/link-cable-compatible-with-quest-3?ref=uyilprxj",
        "image": "https://goaffpro-product-images.b-cdn.net/aHR0cHM6Ly93d3cua2l3aWRlc2lnbi5jb20vY2RuL3Nob3AvZmlsZXMvS0lXSWRlc2lnbl8xNkZUX2NhYmxlbGlua18wLmpwZw==?optimiser=image",
        "source": "KIWI Design"
    },
    {
        "title": "Getting a new headset?",
        "body": "Consider using my referral :)",
        "link": "https://www.meta.com/referrals/link/dotindex",
        "image": "img/ad/quest3.webp",
        "source": "Meta"
    }
];

function createAd() {
    if (adsEnabled) {
        let data = adOptions[Math.floor(Math.random() * adOptions.length)];
        createNotification(data);
    }
}

// 5% chance on load
if (Math.random() < 10.05) {
    createAd();
}

// 1 minute
setTimeout(() => {
    createAd();
}, 1000 * 60);

// 5 minute
setTimeout(() => {
    createAd();
}, 1000 * 60 * 5);

// 10 minute loop
setInterval(() => {
    createAd();
}, 1000 * 60 * 10);