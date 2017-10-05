<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <meta name="language" content="English">
    <meta http-equiv="content-language" content="en">
    <meta http-equiv="content-type" content="text/html; charset=UTF-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">

    <link href="css/style.css" rel="stylesheet" media="all">

    <title>Payments Management</title>
</head>
<body>

<div class="payment-modal">
    <div class="form">
        <h3>ADD NEW PAYMENT</h3>
        <button class="close"></button>

        <form action="?action=add" method="post">

            <div class="item title">
                <label for="payment-form-title">Title:</label>
                <input type="text" name="title" id="payment-form-title">
            </div>

            <div class="item amount">
                <label for="payment-form-amount">Amount:</label>
                <input type="number" name="amount" id="payment-form-amount" step="any">
            </div>

            <div class="item">
                <label for="payment-form-category">Category:</label>
                <select id="payment-form-category" name="category">
                    <option value="">Choose category</option>
                    <option value="mobile_services">Mobile services</option>
                    <option value="gasoline">Gasoline</option>
                    <option value="food">Food</option>
                    <option value="charity">Charity</option>
                    <option value="transport">Transport</option>
                </select>
            </div>

            <div class="item">
                <label for="payment-form-date">Date:</label>
                <input type="date" name="date" id="payment-form-date" value="<?=date("Y-m-d")?>">
            </div>

            <div class="item">
                <label for="payment-form-comment">Comment:</label>
                <textarea name="comment" id="payment-form-comment"></textarea>
            </div>

            <button type="submit">Create</button>
        </form>
    </div>
</div>

<header>
    <div class="container">
        <a href="?" class="logo"></a>

        <div class="welcome">hello user</div>
    </div>
</header>

<section class="filter-area">
    <div class="container">
        <button class="add-payment-button">ADD PAYMENT</button>

        <div class="extended-filters">
            <button>extended filters</button>
        </div>

        <label class="search-area">
            <input type="text" name="search-form-title" placeholder="filter by any property...">
        </label>
    </div>
</section>

<section class="extended-filters">
    <div class="container">
        <div class="by-category">
            <h2>filter by category</h2>

            <div class="labels">
                <label><input type="checkbox" name="search-form-category[]" value="mobile_services">mobile services</label>
                <label><input type="checkbox" name="search-form-category[]" value="gasoline">gasoline</label>
                <label><input type="checkbox" name="search-form-category[]" value="food">food</label>
                <label><input type="checkbox" name="search-form-category[]" value="charity">charity</label>
                <label><input type="checkbox" name="search-form-category[]" value="transport">transport</label>
            </div>
        </div>

        <div class="by-date">
            <h2>filter by date</h2>

            <input name="search-form-date-from" type="date" value="<?=date("Y-m-d", strtotime("-6 months"))?>">
            <input name="search-form-date-to" type="date" value="<?=date("Y-m-d")?>">
        </div>

        <div class="by-amount">
            <h2>filter by amount</h2>

            <input name="search-form-amount-from" type="number" placeholder="from">
            <input name="search-form-amount-to" type="number" placeholder="to">
        </div>
    </div>
</section>

<section class="result">
    <h1 class="container"><span>0</span> records found</h1>

    <div class="container">
        <div class="result"></div>

        <div class="charts">
            <h2>Payment per month</h2>
            <div class="chart by-month"></div>

            <h2>Payment per category</h2>
            <div class="chart by-category"></div>
        </div>
    </div>

    <div class="container">
        <div class="total">
            <div>Total:</div>
            <div class="amount"></div>
        </div>
    </div>
</section>

<footer>
    2017<br>payment management
</footer>

<script type="text/javascript" src="js/jquery-3.2.1.min.js"></script>
<script type="text/javascript" src="js/jquery.touchSwipe.min.js"></script>
<script type="text/javascript" src="js/indexedDB.js"></script>
<script type="text/javascript" src="js/scripts.js"></script>

</body></html>