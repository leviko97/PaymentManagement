<?php

namespace PaymentManager;

use PDO;

class payments{
    private $db;

    public function __construct(){
        $this->db = new PDO("mysql:host=localhost;dbname=paymentmanager", "root", "Paroli97@");
    }

    public function getData(){
        $data = $this->db->query("SELECT * FROM payments")->fetchAll();

        return $data;
    }

    public function addPayment($data){
        $mustFill = ['title','amount','category','date'];

        foreach ($mustFill as $item)
            if (!isset($data[$item]) or strlen($data[$item]) === 0)
                return [false, 'You must fill important values!'];

        if (!$this->validDate($data['date']))
            return [false, 'Wrong date!'];

        if ((bool) preg_match('/[^0-9a-zA-Z ?!.;,]/i', $data['title']))
            return [false, 'Title contains wrong characters!'];

        if (!is_numeric($data['amount']))
            return [false, 'Enter correct amount!'];

        if (!in_array($data['category'], ['mobile_services','gasoline','food','charity','transport']))
            return [false, 'Wrong category!'];

        if (isset($data['comment']) && strlen($data['comment']) > 0 && (bool) preg_match('/[^0-9a-zA-Z \n-?!.;,]/i', $data['comment']))
            return [false, 'Comment contains wrong characters!'];

        $query = $this->db->prepare("
            INSERT INTO payments(`title`, `amount`, `category`, `date`, `comment`) VALUES
            (
              :title,
              :amount,
              :category,
              :date,
              :comment
            );
        ");

        $query->execute([
            ':title'    => $data['title'],
            ':amount'   => $data['amount'],
            ':category' => $data['category'],
            ':date'     => $data['date'],
            ':comment'  => strlen($data['comment']) > 0 ? $data['comment'] : null
        ]);

        return [true, 'Successfully inserted!', $this->db->lastInsertId()];
    }

    public function sync($data){
        $result = [];

        foreach ($data as $item){
            $addItem = $this->addPayment($item);

            if (!isset($addItem[0]) || !isset($addItem[1]))
                $result[] = [false, $item['id']];

            else{
                $result[] = [
                    $addItem[0],
                    $addItem[0] === true ? $addItem[2] : $item['id'],
                    $item['id']
                ];
            }
        }
        
        return $result;
    }

    public function filter($data){
        $page = isset($_GET['page']) && (int) $_GET['page'] > 0 ? (int) $_GET['page'] : 1;
        $limit = 7;

        if (isset($data['title']) && strlen($data['title']) > 0 && (bool) preg_match('/[^0-9a-zA-Z ?!.;,]/i', $data['title']))
            return [false, 'search-form-title'];

        if (isset($data['category']) && count($data['category']) > 0 && is_array($data['category']))
            foreach ($data['category'] as $category)
                if (!in_array($category, ['mobile_services','gasoline','food','charity','transport']))
                    return [false, false];

        if (!isset($data['date_from']) || !isset($data['date_to']) || !$this->validDate($data['date_from']) || !$this->validDate($data['date_to']))
            return [false, ['search-form-date-from','search-form-date-to']];

        if (isset($data['amount_from']) && strlen($data['amount_from']) > 0 && !number_format($data['amount_from']))
            return [false, 'search-form-amount-from'];

        if (isset($data['amount_to']) && strlen($data['amount_to']) > 0 && !number_format($data['amount_to']))
            return [false, 'search-form-amount-to'];

        $where = [];

        $where[] = "date BETWEEN '".$data['date_from']."' AND '".$data['date_to']."'";

        if (isset($data['title']) && strlen($data['title']) > 0)
            $where[] = "title LIKE '%".$data['title']."%'";

        if (isset($data['category']) && is_array($data['category']) && count($data['category']) > 0)
            $where[] = "category IN ('".implode("','", $data['category'])."')";

        if (isset($data['amount_from']) && (double) $data['amount_from'] > 0)
            $where[] = "amount >= ".$data['amount_from'];

        if (isset($data['amount_to']) && (double) $data['amount_to'] > 0)
            $where[] = "amount <= ".$data['amount_to'];

        $whereString = '';
        foreach ($where as $item)
            $whereString .= (strlen($whereString) > 0 ? ' AND ' : '').$item;

        $allItemsSelect = $this->db->query("SELECT count(*) countAll, ROUND(SUM(amount), 2) amount FROM payments WHERE ".$whereString)->fetch();

        $allItems = $allItemsSelect['countAll'];
        $sumAmount = $allItemsSelect['amount'];

        $pages = ceil($allItems/$limit);

        $data = $this->db->query("
            SELECT *
            FROM payments
            WHERE ".$whereString."
            ORDER BY id DESC
            LIMIT ".($page*$limit-$limit).", ".$limit."
        ")->fetchAll();

        $byMonth = $this->db->query("
            SELECT YEAR(date) as year,

                CASE
                    WHEN MONTH(date) = 1 THEN 'Jan'
                    WHEN MONTH(date) = 2 THEN 'Feb'
                    WHEN MONTH(date) = 3 THEN 'Mar'
                    WHEN MONTH(date) = 4 THEN 'Apr'
                    WHEN MONTH(date) = 5 THEN 'May'
                    WHEN MONTH(date) = 6 THEN 'Jun'
                    WHEN MONTH(date) = 7 THEN 'Jul'
                    WHEN MONTH(date) = 8 THEN 'Aug'
                    WHEN MONTH(date) = 9 THEN 'Sep'
                    WHEN MONTH(date) = 10 THEN 'Oct'
                    WHEN MONTH(date) = 11 THEN 'Nov'
                    WHEN MONTH(date) = 12 THEN 'Dec'
                END AS month,
                
                ROUND(SUM(amount), 2) amount
            
            FROM payments
            WHERE ".$whereString."
            GROUP BY YEAR(date), MONTH(date)
        ")->fetchAll();

        $byCat = $this->db->query("
            SELECT category, ROUND(SUM(amount), 2) amount
            FROM payments
            WHERE ".$whereString."
            GROUP BY category
        ")->fetchAll();

        return [
            'rows'      => $allItems,
            'page'      => $page,
            'pages'     => $pages,
            'data'      => $data,
            'byMonth'   => $byMonth,
            'byCat'     => $byCat,
            'sum'       => number_format($sumAmount, 2)
        ];
    }

    private function validDate($date){
        $dateExplode = explode('-', $date);
        $validDate = count($dateExplode) === 3
            && checkdate((int) $dateExplode[1], (int) $dateExplode[2], (int)$dateExplode[0])
            && strlen($dateExplode[0]) === 4
            && strlen($dateExplode[1]) === 2
            && strlen($dateExplode[2]) === 2;

        return $validDate;
    }
}