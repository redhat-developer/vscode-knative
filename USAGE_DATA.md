## [knative Extension](https://github.com/redhat-developer/vscode-knative)

### Usage Data

* when extension is activated
* when a command contributed by extension is executed
    * command's ID
    * command's error message (in case of exception)
    * command's specific data like knative, function version and to check which command user has used.
* when extension is deactivated
* Command which send data to telemetry.
    * Build and Deploy command.
    * Create function command.