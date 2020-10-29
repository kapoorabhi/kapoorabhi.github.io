let version = 'v1::';

self.addEventListener('install', function(event) {
    console.log('WORKER:: install event in progress!!');

    event.waitUntil(
        /*
            The caches built-in is a Promise based API that helps you cache responses,
            as well as inding and deleting them
        */
       caches
        /*
            You can open a cache by name and this method returns a promise.
            We use a versioned cache name here so that we can remove old cache entries 
            in one fell swoop later, when phasing out an older service worker
        */
       .open(`${version}fundamentals`)
       .then(function(cache) {
           console.log('WORKER:: CACHE in Install event::', cache);
            /*
                After the cache is opened, we can fill it with the offline fundamentals.
                The method below will add all resources we have indicated to the cache,
                after making HTTP requests for each of them
            */
           return cache.addAll([
               '/',
               'images',
               'index.css',
               'index.js'
           ]);
       })
       .then(function() {
           console.log('WORKER:: Install Completed!!');
       })
    );
});

self.addEventListener('fetch', function(event) {
    console.log('WORKER::: fetch event in progress!!!');

    /*
        We should only cache GET requests, and deal with the rest of the methods 
        in the client-side, by handling failed POST, PUT, PATCH etc. requests.
    */
    if(event.request.method !== 'GET') {
        /*
            If we don't block the request as shown below, then the request will go to the network as usual
        */
        console.log('WORKER::: fetch event ignored.', event.request.method, event.request.url);
        return;
    }

    /*

    */

    event.respondWith(
        caches

        .match(event.request)
        .then(function(cached) {
            console.log("WORKER:: CACHED in fetch event:::",cached);

            /*
                Even if the response is in our cache, we go to the network as well.
                This pattern is known for producing "eventually fresh" responses,
                where we return cached responses immediately, and meanwhile pull 
                a network response and store that in the cache.
            */
            let networked = fetch(event.request)
            // Handle the network request with success and failure scenarios.
            .then(fetchedFromNetwork, unableToResolve)
            // Catch errors on fetchedFromNetwork handler as well
            .catch(unableToResolve);

            /*
                We return the cached response immediatelyif there is one, and fall back
                to waiting on the network as well
            */
            console.log('WORKER:: fetch event', cached ? '(cached)' : '(network)', event.request.url);
            return cached || networked;


            function fetchedFromNetwork(response) {
                /*
                    We copy the response before replying to the network request
                    This is the response that will be stored on the ServiceWorked cache.
                */

               let cacheCopy = response.clone();
               console.log('WORKER: fetch response from network.', event.request.url);

               caches
                // We open a cache to store the response for this request.
                .open(version + 'pages')
                .then(function add(cache) {
                /* We store the response for this request. It'll later become
                    available to caches.match(event.request) calls, when looking
                    for cached responses.
                */
                cache.put(event.request, cacheCopy);
                })
                .then(function() {
                console.log('WORKER: fetch response stored in cache.', event.request.url);
                });

                // Return the response so that the promise is settled in fulfillment.
                return response;
            }

            /* When this method is called, it means we were unable to produce a response
           from either the cache or the network. This is our opportunity to produce
           a meaningful response even when all else fails. It's the last chance, so
           you probably want to display a "Service Unavailable" view or a generic
           error response.
        */
        function unableToResolve () {
            /* There's a couple of things we can do here.
               - Test the Accept header and then return one of the `offlineFundamentals`
                 e.g: `return caches.match('/some/cached/image.png')`
               - You should also consider the origin. It's easier to decide what
                 "unavailable" means for requests against your origins than for requests
                 against a third party, such as an ad provider
               - Generate a Response programmaticaly, as shown below, and return that
            */
  
            console.log('WORKER: fetch request failed in both cache and network.');
  
            /* Here we're creating a response programmatically. The first parameter is the
               response body, and the second one defines the options for the response.
            */
            return new Response('<h1>Service Unavailable</h1>', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: new Headers({
                'Content-Type': 'text/html'
              })
            });
          }

        })
    );
});