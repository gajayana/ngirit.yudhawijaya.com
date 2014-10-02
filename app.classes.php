<?php
date_default_timezone_set('Asia/Jakarta');
require_once 'config.php';
global $pdo, $monthNames, $now, $mysqldatetime;

class NgiritPol {
	function __construct() {
		try {
			$this->pdo = new PDO('mysql:host='.DB_H.';dbname='.DB_D.';charset=utf8', DB_U, DB_P);
			$this->pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
			//$this->pdo->setAttribute(PDO::MYSQL_ATTR_INIT_COMMAND, 'SET time_zone=\'+07:00\'');
			$this->pdo->setAttribute(PDO::MYSQL_ATTR_INIT_COMMAND, 'SET NAMES utf8');
			$this->pdo->setAttribute(PDO::ATTR_EMULATE_PREPARES, false);

			$this->monthNames = array('', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember');
			$this->now = getdate();
			$this->mysqldatetime = date('Y-m-d H:i:s');
		} catch(PDOException $e) {
			echo $e->getMessage();
		}
			
	}

	function getFunnyLittleHead($title) {
		$str = '<meta charset="UTF-8">
				<title>'.$title.'</title>
				<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
				<meta name="apple-mobile-web-app-capable" content="yes">
				<meta name="format-detection" content="telephone=no">
				<link rel="stylesheet" href="assets/css/style.css">';
		echo $str;
		unset($str);
	}

	function getIndexBody() {
		//echo $this->mysqldatetime;
		$curr = $this->now;
		$currDate = $curr['mday'];
		$currMonthInt = $curr['mon'];
		$currMonth = $this->monthNames[$currMonthInt];
		$currYear = $curr['year'];

		$strQuerySum = 'select sum(tblspending.spending) as totalMonthlySpending, tbllimit.upper, tbllimit.lower
						from tblspending
						left join tbllimit on tblspending.id_limit = tbllimit.id
						where extract(month from tblspending.dt)='.$currMonthInt.' and extract(year from tblspending.dt)='.$currYear;
		$statementSum = $this->pdo->prepare($strQuerySum);
		$statementSum->execute();
		$resultSum = $statementSum->fetch(PDO::FETCH_ASSOC);

		$totSpending = $resultSum['totalMonthlySpending'];
		//$totSpending = 2500001;
		if(empty($totSpending)) $totSpending = 0;
		

		$limitUpper = $resultSum['upper'];
		$limitLower = $resultSum['lower'];
		if(empty($limitUpper)) $limitUpper = 250000;
		if(empty($limitLower)) $limitLower = 210000;

		if($totSpending > $limitUpper) {
			$circleColour = ' red';
		} else if($totSpending <= $limitUpper && $totSpending >= $limitLower) {
			$circleColour = ' yellow';
		} else if ($totSpending >= 0 && $totSpending < $limitLower) {
			$circleColour = ' green';
		}

		$formattedTotSpending = number_format($totSpending, 0, ',', '.');

		$linkMonthlyGeneral = isset($_SESSION['ID_KONTROL']) ? '?p=monthlygeneral' : '#';

		$str = '<body class="pr">';
		
		$str .= '<div class="wrapper center-all">';

		$str .= '<header><h1>'.$currDate.' '.$currMonth.' '.$currYear.'</h1></header>';
		$str .= '<a href="'.$linkMonthlyGeneral.'" class="circle pr'.$circleColour.'"><span id="total-spending">Rp '.$formattedTotSpending.'</span></a>';
		
		$str .= '<form id="form-spending" action="?p=&amp;sp=process" method="post">';
		$str .= '<div class="controls-group">';
		$str .= '<div class="control pr"><input id="txt-event" name="txt-event" type="text" placeholder="Kejadian" maxlength="255" autocomplete="off" autofocus required></div>';
		$str .= '<div class="control pr"><input id="txt-spending" name="txt-spending" type="text" placeholder="Pengeluaran" maxlength="7" autocomplete="off" required></div>';
		$str .= '<div class="control pr"><input id="txt-token" name="txt-token" type="password" placeholder="Kunci" maxlength="7" autocomplete="off" required></div>';
		$str .= '<div class="control"><input id="btn-submit" type="submit" value="Kirim" onclick="spendingEntry.submitSpending(); return false;"></div>';
		$str .= '</div>';
		$str .= '</form>';


		$str .= '</div>';
		$str .= $this->getJS();
		$str .= '</body>';
		echo $str;
		unset($str);
	}

	function getJS() {
		return '<script src="assets/js/lapanbelas.min.js" async></script>';
	}

	function getMonthlyDetail($year, $month) {
		$strQuery = 'select extract(day from dt) as date, extract(month from dt) as month, extract(year from dt) as year,  event, spending 
					 from tblspending 
					 where extract(month from dt)=:mt and extract(year from dt)=:yr
					 order by dt asc';
		$statement = $this->pdo->prepare($strQuery);
		
		$statement->bindParam(':mt', $month);
		$statement->bindParam(':yr', $year);

		$statement->execute();
		$results = $statement->fetchAll(PDO::FETCH_ASSOC);
		$arrSpending = array();

		//var_dump($results);
		foreach($results as $result) {
			$d = $result['date'];
			$e = $result['event'];
			$s = $result['spending'];
			

			array_push($arrSpending, $s);

			if($s > 50000) {
				$trClass = ' class="bg-red"';
			} else if ($s > 25000 && $s <= 50000) {
				$trClass = ' class="bg-yellow"';
			} else {
				$trClass = '';
			}

			$strLoopTable .= '<tr'.$trClass.'>';
			$strLoopTable .= ($md != $d) ? '<td>'.$d.'</td>' : '<td>&nbsp;</td>';
			$strLoopTable .= '<td>'.$e.'</td>';
			$strLoopTable .= '<td>'.$s.'</td>';
			$strLoopTable .= '</tr>';

			$md = $d;

			
		}

		$totalSpending = array_sum($arrSpending);

		$str = '<body>';
		$str .= '<div class="wrapper">';
		$str .= '<header><h1>'.strtoupper($this->monthNames[$month]).' '.$year.'</h1></header>';

		$str .= '<table>';
		$str .= '<thead><tr><td>Tgl</td><td>Kejadian</td><td>Biaya</td></tr></thead>';
		$str .= '<tbody>';
		$str .= $strLoopTable;
		$str .= '<tr class="sum"><td colspan="2" class="txt-bold txt-right">Total</td><td class="txt-right">'.$totalSpending.'</td></tr>';
		$str .= '</tbody>';
		$str .= '</table>';
		
		$str .= '</div>';
		$str .= $this->getJS();
		$str .= '</body>';
		echo $str;
		unset($str);
	}

	function getMonthlyGeneral() {
		$current = $this->now;
		$startYear = 2014;
		$endYear = $current['year'];
		$currMonth = $current['mon'];
		$linkMonthlyDetail = isset($_SESSION['ID_KONTROL']) ? '?p=monthlydetail' : '#';
		//var_dump($this->authIsValid());
		$str = '<body>';
		$str .= '<div class="wrapper">';

		for($i = $endYear; $i >= $startYear; $i--) {

			$strLoop .= '<div class="wrapper-details">';
			$strLoop .= '<header><h1>'.$i.'</h1></header>';
			
			//$numMonth = ($i == $endYear) ? $currMonth : 12;

			if($i == $endYear && $i != $startYear) {
				$startMonth = 1;
				$endMonth = $currMonth;
			} else if($i == $startYear) {
				$startMonth = 8;
				$endMonth = $currMonth;
			} else {
				$startMonth = 1;
				$endMonth = 12;
			}

			for($j = $endMonth; $j >= $startMonth; $j--) {
				$strQuerySum = 'select sum(tblspending.spending) as totalMonthlySpending, tbllimit.upper, tbllimit.lower
								from tblspending
								left join tbllimit on tblspending.id_limit = tbllimit.id
								where extract(month from tblspending.dt)='.$j.' and extract(year from tblspending.dt)='.$i;
				$statementSum = $this->pdo->prepare($strQuerySum);
				$statementSum->execute();
				$resultSum = $statementSum->fetch(PDO::FETCH_ASSOC);

				$totSpending = $resultSum['totalMonthlySpending'];
				if(empty($totSpending)) $totSpending = 0;

				$limitUpper = $resultSum['upper'];
				$limitLower = $resultSum['lower'];
				if(empty($limitUpper)) $limitUpper = 250000;
				if(empty($limitLower)) $limitLower = 210000;

				if($totSpending > $limitUpper) {
					$tdColour = ' red';
				} else if($totSpending <= $limitUpper && $totSpending >= $limitLower) {
					$tdColour = ' yellow';
				} else if ($totSpending >= 0 && $totSpending < $limitLower) {
					$tdColour = ' green';
				}

				$strLoop .= '<a href="'.$linkMonthlyDetail.'&amp;sp=index&amp;m='.$j.'&amp;y='.$i.'" class="detail cf"><span class="date">'.substr($this->monthNames[$j], 0, 3).'</span><span class="spendings'.$tdColour.'">Rp '.number_format($totSpending, 0, ',', '.').'</span></a>';
			}

			$strLoop .= '</div>';

		}

		$str .= $strLoop;

		$str .= '</div>';
		$str .= $this->getJS();
		$str .= '</body>';

		echo $str;
		unset($str);
	}

	function processNewSpending($event, $spending, $token) {
		$curr = $this->now;
		$currentDate = $curr['year'].$curr['mon'].$curr['mday'];
		$currentToken = sha1(''.$currentDate); //keep token as my secret

		if(sha1($token.$currentDate) == $currentToken) {
			session_start();
			if(!isset($_SESSION['ID_KONTROL'])) $_SESSION['ID_KONTROL'] = session_id().sha1($token.$currentDate);

			$strQueryLimit = 'select ID from tbllimit where valid=1';
			$statementLimit = $this->pdo->prepare($strQueryLimit);
			$statementLimit->execute();
			$resultLimit = $statementLimit->fetch(PDO::FETCH_ASSOC);

			
			$strQuery = 'insert into tblspending(id_limit, dt, event, spending) values ('.$resultLimit['ID'].', \''.$this->mysqldatetime.'\', :evt, :spend)';
			$statement = $this->pdo->prepare($strQuery);
			$statement->bindParam(':evt', $event);
			$statement->bindParam(':spend', $spending);
			$statement->execute();

			//echo $strQuery;

			//header('location:index.php');
			echo '<script>window.location.href = \'index.php\';</script>';
		} else {
			echo 'arek iki jik nekat ae.';
		}
	}

	function sanitizeEntry($str) {
		$str = trim($str);
		$str = strip_tags($str);
		if(get_magic_quotes_gpc()) {
			$str = stripslashes($str);
		}
		//$str = $this->pdo->quote($str);
		//$str = nl2br($str);
		return $str;
	}

	function __destruct() {
		$this->pdo = null;
	}
}

?>