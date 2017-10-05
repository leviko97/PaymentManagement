window.paymentFilter = {};

$(document).ready(function () {
    filter();
});

$(window).resize(function () {
    if ($('.payment-modal').hasClass('active'))
        $('body,header').css('width','auto');
});

$(document).on('change', 'section.extended-filters .by-category input[type="checkbox"]', function () {
    $(this).parent().attr('data-checked', $(this).prop('checked'));
});

$(document).on('click', 'section.filter-area .extended-filters button', function () {
    var extendedFilter = $('section.extended-filters');

    if (extendedFilter.hasClass('active')) extendedFilter.removeClass('active');
    else extendedFilter.addClass('active');
});

$(document).on('click', 'section.filter-area .add-payment-button', function () {
    $('body,header').css({
        overflow: 'hidden',
        width: $(window).width()+'px'
    });
    $('.payment-modal').addClass('active');
});

$(document).on('click', '.payment-modal .form button.close', function () {
    closePaymentModal();
});

$(document).on('click', '.payment-modal.active', function(e){
    if ($(e.target).closest('.payment-modal .form').length != 1)
        closePaymentModal();
});

$(document).on('submit', '.payment-modal form', function () {
    var form = $(this);

    $.ajax({
        type: 'POST',
        url: $(this).attr('action'),
        data: $(this).serialize()
    })
        .done(function (response) {
            form.parent().find('.error').remove();

            localDBAdd({
                id:         response[2],
                title:      form.find('[name="title"]').val(),
                amount:     form.find('[name="amount"]').val(),
                category:   form.find('[name="category"]').val(),
                date:       form.find('[name="date"]').val(),
                comment:    form.find('[name="comment"]').val()
            });

            closePaymentModal();
            filter();
        })
        .fail(function (response) {
            // if there's not internet connection
            if (response.readyState === 0){
                var localId = 'local-' + new Date().getTime();

                localDBAdd({
                    id:         localId,
                    title:      form.find('[name="title"]').val(),
                    amount:     form.find('[name="amount"]').val(),
                    category:   form.find('[name="category"]').val(),
                    date:       form.find('[name="date"]').val(),
                    comment:    form.find('[name="comment"]').val()
                });

                closePaymentModal();

                setTimeout(function () {
                    localDBSync();
                }, 10000);
            }else{
                if (form.parent().find('.error').length === 0) form.before('<div class="error"></div>');

                form.parent().find('.error')
                    .html(typeof response.responseJSON[1] == 'undefined' ? 'System error!' : response.responseJSON[1]);
            }
        });

    return false;
});

$(document).on('keyup change', '[name^="search-form"]', function () {
    filter();
});

$('section.result .result').scroll(function() {
    if($(this)[0].scrollHeight - $(this)[0].scrollTop == $(this).outerHeight() && window.paymentFilter.pages > window.paymentFilter.page)
        filter(window.paymentFilter.page + 1, false);
});

$('section.result div.container').swipe( {
    swipeLeft: function() {
        $(this).addClass('chart');
    },
    swipeRight: function() {
        $(this).removeClass('chart');
    }
});

function closePaymentModal() {
    $('body,header').removeAttr('style');
    $('.payment-modal').removeClass('active')
        .find('[name="title"],[name="amount"],[name="category"],[name="comment"]')
        .val('');
}

function filter(page, clear){
    var categories = [];
    page = typeof page == 'undefined' ? 1 : parseInt(page);
    clear = typeof clear == 'undefined' ? true : clear;
    window.paymentFilter.page = page;

    $('[name^="search-form-category"]:checked').each(function () {
        categories.push($(this).val())
    });

    var data = {
        title: $('[name="search-form-title"]').val(),
        category: categories,
        date_from: $('[name="search-form-date-from"]').val(),
        date_to: $('[name="search-form-date-to"]').val(),
        amount_from: $('[name="search-form-amount-from"]').val(),
        amount_to: $('[name="search-form-amount-to"]').val()
    };

    $.ajax({
        type: 'POST',
        url: '?action=filter&page='+page,
        data: data
    })
        .done(function (result) {
            window.paymentFilter.pages = result.pages;

            var resultBox = $('section.result .result');
            var sumBox = $('section.result .total .amount');
            var byMonthChart = $('section.result .charts .chart.by-month');
            var byCatChart = $('section.result .charts .chart.by-category');

            if(clear) $('section.result > h1 span').html(result.rows);

            if (clear) resultBox.html('');
            if (clear) sumBox.html(result.sum);

            for (var i in result.data){
                var item = result.data[i];
                var comment = item.comment === null ? '' :
                    '<p class="comment">'+item.comment+'</p>';

                resultBox.append('<div class="item">' +
                    '<h3>'+item.title+'</h3>' +
                    '<span class="category">'+item.category+'</span>' +
                    '<span class="date">'+item.date+'</span>' +
                    '<span class="amount">-'+item.amount+'</span>' +
                    comment +
                    '</div>');
            }

            var largestByMonth = 0;
            var largestByCat = 0;
            for (var i in result.byMonth)
                if (parseFloat(result.byMonth[i].amount) > largestByMonth)
                    largestByMonth = parseFloat(result.byMonth[i].amount);
            for (var i in result.byCat)
                if (parseFloat(result.byCat[i].amount) > largestByCat)
                    largestByCat = parseFloat(result.byCat[i].amount);

            if (clear) byMonthChart.html('');
            if (clear)
                for (var i in result.byMonth){
                var item = result.byMonth[i];

                byMonthChart.append('<div class="col">' +
                    '<span class="name">'+item.month+'</span>' +
                    '<span class="i" style="height:'+(item.amount/largestByMonth*100)+'%"><span>'+item.amount+'</span></span>' +
                    '</div>');
            }


            if (clear) byCatChart.html('');
            if (clear)
                for (var i in result.byCat) {
                var item = result.byCat[i];
                var name =

                byCatChart.append('<div class="col">' +
                    '<span class="name">'+item.category.replace(/_/g, ' ')+'</span>' +
                    '<span class="i" style="height:'+(item.amount / largestByCat * 100)+'%"><span>'+item.amount+'</span></span>' +
                    '</div>');
            }
        })
        .fail(function (response) {
            if (response.readyState === 0) filterOffline(data);
            else console.log('System error');
        });
}

function filterOffline(data) {
    var result = [];
    var byMonth = [];
    var byCategory = {};
    var total = 0;

    var objectStore = window.localdb.db.transaction('payments').objectStore("payments");
    window.localdb.localData = [];

    objectStore.openCursor().onsuccess = function(event) {
        var cursor = event.target.result;

        if (cursor) {
            // Filter by category
            var categoryFilter = data.category.length > 0 ? data.category.indexOf(cursor.value.category) >= 0 : true;

            // Filter by date
            var dateFilter = parseInt(cursor.value.date.replace(/-/g, '')) <= parseInt(data.date_to.replace(/-/g, '')) &&
                parseInt(cursor.value.date.replace(/-/g, '')) >= parseInt(data.date_from.replace(/-/g, ''));

            // Filter by amount
            var amountFilter = (data.amount_from == "" ? true : parseFloat(cursor.value.amount) >= parseFloat(data.amount_from)) &&
                (data.amount_to == "" ? true : parseFloat(cursor.value.amount) <= parseFloat(data.amount_to));

            // Filter by title
            var titleFilter = data.title == "" ? true : cursor.value.title.includes(data.title);

            if (categoryFilter && dateFilter && amountFilter && titleFilter)
                result.push(cursor.value);

            cursor.continue();
        }else{
            var largestByMonth = 0;
            var largestByCat = 0;
            var resultBox = $('section.result .result');
            var sumBox = $('section.result .total .amount');
            var totalBox = $('section.result > h1 span');
            var byMonthChart = $('section.result .charts .chart.by-month');
            var byCatChart = $('section.result .charts .chart.by-category');

            for (var i in result){
                var item = result[i];
                var dateE = item.date.split('-');
                var monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

                if (typeof byCategory[item.category] == 'undefined') byCategory[item.category] = 0;
                if (typeof byMonth[dateE[0]] == 'undefined') byMonth[dateE[0]] = [];
                if (typeof byMonth[dateE[0]][monthNames[parseInt(dateE[1])-1]] == 'undefined') byMonth[dateE[0]][monthNames[parseInt(dateE[1])-1]] = 0;

                byCategory[item.category] += parseFloat(item.amount);
                byMonth[dateE[0]][monthNames[parseInt(dateE[1])-1]] += parseFloat(item.amount);

                total += parseFloat(item.amount);
            }

            resultBox.html('');
            for (var i = result.length-1; i>=0; i--){
                var resultItem = result[i];

                var comment = resultItem.comment === null ? '' :
                    '<p class="comment">'+resultItem.comment+'</p>';

                resultBox.append('<div class="item">' +
                    '<h3>'+resultItem.title+'</h3>' +
                    '<span class="category">'+resultItem.category+'</span>' +
                    '<span class="date">'+resultItem.date+'</span>' +
                    '<span class="amount">-'+resultItem.amount+'</span>' +
                    comment +
                    '</div>');
            }

            for (var i in byMonth)
                for (var j in byMonth[i])
                    if (largestByMonth < byMonth[i][j]) largestByMonth = byMonth[i][j];

            byMonthChart.html('');
            for (var i in byMonth)
                for (var j in byMonth[i]) {
                    byMonthChart.append('<div class="col">' +
                        '<span class="name">' + j + '</span>' +
                        '<span class="i" style="height:' + (byMonth[i][j] / largestByMonth * 100) + '%"><span>' + byMonth[i][j] + '</span></span>' +
                        '</div>');
                }

            for (var cat in byCategory)
                if (largestByCat < byCategory[cat]) largestByCat = byCategory[cat];

            byCatChart.html('');
            for (var cat in byCategory)
                byCatChart.append('<div class="col">' +
                    '<span class="name">'+cat.replace(/_/g, ' ')+'</span>' +
                    '<span class="i" style="height:'+(byCategory[cat] / largestByCat * 100)+'%"><span>'+byCategory[cat]+'</span></span>' +
                    '</div>');

            sumBox.html((Math.round(total*100)/100).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","));
            totalBox.html(result.length);
        }
    }
}