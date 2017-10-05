window.indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;

window.IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.msIDBTransaction;
window.IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange || window.msIDBKeyRange;

window.localdb = {};
window.localdb.request = window.indexedDB.open("PaymentManager", 1);

window.localdb.request.onerror = function(event) {
    console.log("error: ");
};

window.localdb.request.onsuccess = function(event) {
    window.localdb.db = window.localdb.request.result;
    console.log("success: "+ window.localdb.db);
    localDBSync();
};

window.localdb.request.onupgradeneeded = function(event) {
    var payments = [];

    var db = event.target.result;
    var objectStore = db.createObjectStore("payments", {keyPath: "id"});
    for (var i in payments) {
        objectStore.add(payments[i]);
    }

    localDBUpgrade();
};

function localDBAdd(data) {
    window.localdb.request = window.localdb.db.transaction(["payments"], "readwrite")
        .objectStore("payments")
        .add({
            id: data.id,
            title: data.title,
            amount: data.amount,
            category: data.category,
            date: data.date,
            comment: data.comment
        });

    window.localdb.request.onsuccess = function(event) {
        console.log('Added')
    };

    window.localdb.request.onerror = function(event) {
        console.log('error');
    }
}

function localDBSync() {
    var objectStore = window.localdb.db.transaction('payments').objectStore("payments");
    window.localdb.localData = [];

    objectStore.openCursor().onsuccess = function(event) {
        var cursor = event.target.result;

        if (cursor){
            if (cursor.key.startsWith('local'))
                window.localdb.localData.push(cursor.value);

            cursor.continue();
        }
        else if(window.localdb.localData.length > 0){
            $.ajax({
                type: 'POST',
                url: '?action=sync',
                data: {
                    data: window.localdb.localData
                }
            })
                .done(function (result) {
                    for (i in result){
                        var resultItem = result[i];
                        var itemData = $.grep(window.localdb.localData, function(e){ return e.id == resultItem[2]; });
                        itemData = itemData.length > 0 ? itemData[0] : false;

                        var request = window.localdb.db.transaction(['payments'], "readwrite")
                            .objectStore('payments')
                            .delete(resultItem[2]);

                        if (resultItem[0] == true){
                            localDBAdd({
                                id: resultItem[1],
                                title: itemData.title,
                                amount: itemData.amount,
                                category: itemData.category,
                                date: itemData.date,
                                comment: itemData.comment
                            });
                        }else {
                            alert(
                                "There's problem while serving data\n" +
                                "It'll be removed and please add it again!\n" +
                                "Title: "+itemData.title+
                                "Amount: "+itemData.amount+
                                "Date: "+itemData.date
                            );
                        }
                    }
                })
                .fail(function (response) {
                    if (response.readyState === 0)
                        setTimeout(function () {
                            localDBSync();
                        }, 10000);

                    else
                        alert("System error! Please try to reload!");
                });
        }
    };

}

function localDBUpgrade() {
    $.ajax({
        type: 'GET',
        url: '?action=getData'
    })
        .done(function (result) {
            for (var i in result)
                localDBAdd(result[i])
        })
        .fail(function (response) {
            if (response.readyState === 0)
                setTimeout(function () {
                    localDBUpgrade();
                }, 10000);
        });
}

