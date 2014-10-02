<?php
	ini_set('display_errors', 1);
	error_reporting(E_ALL ^ E_NOTICE);
	session_start();
	require_once 'app.classes.php';

	$p = $_REQUEST['p'];
	if(empty($p) || !ctype_alpha($p)) $p = '';

	$sp = $_REQUEST['sp'];
	if(empty($sp) || !ctype_alpha($sp)) $sp = '';

	$content = new NgiritPol;
?>
<!DOCTYPE html>
<html lang="en">
<head>
	<?php
		$content->getFunnyLittleHead('Kontrol Keuangan');
	?>
</head>

	<?php
		if($p == 'monthlygeneral') {
			$content->getMonthlyGeneral();
		} else if ($p == 'monthlydetail') {

			$curr = getdate();
			$currMonth = $curr['mon'];
			$currYear = $curr['year'];

			$year = $_REQUEST['y'];
			if(!is_numeric($year)) $year = $currYear;
			$month = $_REQUEST['m'];
			if(!is_numeric($month)) $month = $currMonth;

			if ($sp == 'index') {
				$content->getMonthlyDetail($year, $month);
			} else {
				echo 'meong?';
			}
			
		} else {
			if($sp == 'process') {
				$event = $content->sanitizeEntry($_POST['txt-event']);
				$spending = $content->sanitizeEntry($_POST['txt-spending']);
				$token = $content->sanitizeEntry($_POST['txt-token']);

				if(!is_numeric($spending)) {
					echo 'Galat: pengeluaran bukan angka.';
					exit();
				}

				if(!ctype_alnum($token)) {
					echo 'Galat: token ngawur.';
					exit();
				}

				$content->processNewSpending($event, $spending, $token);
			} else {
				$content->getIndexBody();
			}
			
		}
	?>
</html>