<!doctype html>
<html lang="{{ app()->getLocale() }}">
  <head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="format-detection" content="telephone=no">
    <meta name="description" content="A web-based app to track family's spendings.">
    <meta name="keywords" content="ngirit">
    <meta name="author" content="Yosef Yudha Wijaya <https://yudhawijaya.com">
    <meta name="robots" content="index, follow">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <link href="https://fonts.googleapis.com/css?family=Material+Icons" rel="stylesheet">
    <link href="{{ mix('css/app.css') }}" rel="stylesheet">
    <title>Ngirit</title>
  </head>
  <body>
    <div id="ngirit">
      <router-view></router-view>
    </div>
    <script>
      window.Laravel = @json(['csrf_token' => csrf_token()]);
      @if(\Auth::check())
        window.Ngirit = @json([
          'uuid' => \Auth::user()->id,
        ]);
      @endif
    </script>
    <script src="{{ mix('js/app.js') }}"></script>
  </body>
</html>
