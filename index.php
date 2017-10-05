<?php

include 'payments.php';

use PaymentManager\payments;
$payments = new payments();

if (empty($_GET) && empty($_POST)){
    include 'view.php';
}

if (isset($_GET['action']) && $_GET['action'] == 'getData'){
    header('Content-Type:application/json');

    echo json_encode($payments->getData(), true);
}

if (isset($_GET['action']) && $_GET['action'] == 'add'){
    header('Content-Type:application/json');

    $result = $payments->addPayment($_POST);

    if (!isset($result[0]) || $result[0] === false)
        header("HTTP/1.0 400 Bad Request");

    echo json_encode($result, true);
}

if (isset($_GET['action']) && $_GET['action'] == 'sync'){
    header('Content-Type:application/json');

    if (!isset($_POST['data'])){
        header("HTTP/1.0 400 Bad Request");

        exit;
    }

    $result = $payments->sync($_POST['data']);

    echo json_encode($result, true);
}

if (isset($_GET['action']) && $_GET['action'] == 'filter'){
    header('Content-Type:application/json');

    $result = $payments->filter($_POST);

    echo json_encode($result, true);
}

