#!/usr/bin/env groovy

node('rhel8'){
  stage('Checkout repo') {
    deleteDir()
    git url: "https://github.com/${params.FORK}/vscode-knative.git", branch: params.BRANCH
  }

  stage('Install requirements') {
    def nodeHome = tool 'nodejs-lts'
    env.PATH="${env.PATH}:${nodeHome}/bin"
    sh "npm install -g typescript vsce ovsx"
  }

  stage('Build') {
    sh "npm install"
    sh "npm run vscode:prepublish"
  }

  withEnv(['JUNIT_REPORT_PATH=report.xml']) {
    stage('Unit Tests') {
      wrap([$class: 'Xvnc']) {
        sh "npm test"
        junit 'report.xml'
      }
    }
  }

  stage('UI Tests') {
    wrap([$class: 'Xvnc']) {
      try {
        sh """
        if [ -f \$HOME/.vs-kn/kn ]; then
            rm \$HOME/.vs-kn/kn
        fi
        """
        sh "npm run base-ui-test"
      }
      finally {
        archiveArtifacts artifacts: 'test-resources/*.log,test-resources/**/*.png'
      }
    }
  }

  stage('Package') {
    def packageJson = readJSON file: 'package.json'
    packageJson.extensionDependencies = ["ms-kubernetes-tools.vscode-kubernetes-tools"]
    writeJSON file: 'package.json', json: packageJson, pretty: 4
    sh "vsce package -o knative-${packageJson.version}-${env.BUILD_NUMBER}.vsix"
    sh "sha256sum *.vsix > knative-${packageJson.version}-${env.BUILD_NUMBER}.vsix.sha256"
  }

  if(params.UPLOAD_LOCATION) {
    stage('Snapshot') {
      sh "sftp -C ${UPLOAD_LOCATION}/snapshots/vscode-knative/ <<< \$'put -p *.vsix*'"
    }
  }

  if(publishToMarketPlace.equals('true') || publishToOVSX.equals('true')){
    timeout(time:5, unit:'DAYS') {
      input message:'Approve deployment?', submitter: 'rgrunber, msuman'
    }

    stage "Publish to Marketplaces"
    def vsix = findFiles(glob: '**.vsix')
    // VS Code Marketplace
    if (publishToMarketPlace.equals('true')) {
        withCredentials([[$class: 'StringBinding', credentialsId: 'vscode_java_marketplace', variable: 'TOKEN']]) {
          sh 'vsce publish -p ${TOKEN} --packagePath' + " ${vsix[0].path}"
        }
    }
    // Open-VSX Marketplace
    if (publishToOVSX.equals('true')) {
        withCredentials([[$class: 'StringBinding', credentialsId: 'open-vsx-access-token', variable: 'OVSX_TOKEN']]) {
          sh 'ovsx publish -p ${OVSX_TOKEN}' + " --packagePath ${vsix[0].path}"
        }
    }

    stage "Promote the build to stable"
    sh "sftp -C ${UPLOAD_LOCATION}/stable/vscode-knative/ <<< \$'put -p *.vsix*'"
    archive includes:"**.vsix*"
  }

}
