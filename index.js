console.log('In Index file');

if('serviceWorker' in navigator) {
    console.log('CLIENT::: Service Worker registration in progress!');
    navigator.serviceWorker.register('./service-worker.js').then(() => {
        console.log('CLIENT:: Service Worker registration complete..Yayy!!');
    }, () => {
        console.log('CLIENT:: Service Worker registration failed..Noo :(');
    })
}
else {
    console.log('CLIENT::: Service Worker is not supported :(');
}