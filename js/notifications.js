function createNotification(data={}) {
    let notificationTitle = data.title || 'Notification';
    let notificationBody = data.body || 'This is a test notification';
    let notificationLink = data.link || '';
    let notificationSource = data.source || '';
    let notificationImage = data.image || '';

    let notificationElement = document.createElement('div');
    notificationElement.classList.add('notification');

    let notificationDetailsElement = document.createElement('div');
    notificationDetailsElement.classList.add('notification-details');

    let notificationTitleElement = document.createElement('h4');
    notificationTitleElement.innerText = notificationTitle;
    let notificationBodyElement = document.createElement('p');
    notificationBodyElement.innerText = notificationBody;
    let notificationSourceElement = document.createElement('span');
    notificationSourceElement.innerText = notificationSource;
    notificationDetailsElement.appendChild(notificationTitleElement);
    notificationDetailsElement.appendChild(notificationBodyElement);
    notificationDetailsElement.appendChild(notificationSourceElement);

    let notificationImageElement = document.createElement('img');
    notificationImageElement.src = notificationImage;

    let notificationTimelineElement = document.createElement('div');
    notificationTimelineElement.classList.add('notification-timeline');

    notificationElement.appendChild(notificationTimelineElement);
    notificationElement.appendChild(notificationDetailsElement);
    if (notificationImage) {
        notificationElement.appendChild(notificationImageElement);
    }

    if (notificationLink) {
        notificationElement.addEventListener('click', () => {
            window.open(notificationLink, '_blank');
        });
    }

    document.body.appendChild(notificationElement);
    setTimeout(() => {
        notificationElement.style.transform = 'translateX(0)';
    }, 500);

    setTimeout(() => {
        notificationElement.style.transform = 'translateX(200%)';
        setTimeout(() => {
            notificationElement.remove();
        }, 500);
    }, 10000);
}