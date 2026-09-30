<?php
declare(strict_types=1);

spl_autoload_register(function (string $class): void {
    // Define the base namespace prefix for our application
    $prefix = 'App\\';

    // Base directory where our namespaced classes live (the 'app' folder)
    $baseDir = __DIR__ . '/';

    // Check if the class uses our prefix
    $len = strlen($prefix);
    if (strncmp($prefix, $class, $len) !== 0) {
        return; // Move on if it's not our namespace
    }

    // Get the relative class name (e.g., "Controllers\AuthController")
    $relativeClass = substr($class, $len);

    // Replace namespace backslashes with directory slashes and append .php
    $file = $baseDir . str_replace('\\', '/', $relativeClass) . '.php';

    // If the file exists, require it
    if (file_exists($file)) {
        require_once $file;
    }
});

?>