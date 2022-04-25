## [knative Extension](https://github.com/redhat-developer/vscode-knative)

### Usage Data

* when the extension is activated
* when following command(s) contributed by extension is executed
    * command's ID
    * command's error message (in case of exception)
    * command's specific data like kn version, fn version and to check which command user has used.
* when the extension is deactivated
* Following are the commands which send data to telemetry.
    * Build and Deploy command.
    * Create function command.
    * Invoke function command.