#!/usr/bin/env groovy

node('rhel8'){
  stage('Checkout repo') {
    deleteDir()
    git url: "https://github.com/${params.FORK}/vscode-knative.git", branch: params.BRANCH
  }

  stage('Install requirements') {
    def nodeHome = tool 'nodejs-12.13.1'
    env.PATH="${env.PATH}:${nodeHome}/bin"
    sh "npm install -g typescript vsce"
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
      sh "npm run base-ui-test"
    }
  }

  stage('Package') {
    def packageJson = readJSON file: 'package.json'
    packageJson.extensionDependencies = ["ms-kubernetes-tools.vscode-kubernetes-tools"]
    writeJSON file: 'package.json', json: packageJson, pretty: 4
    sh "vsce package -o knative-${packageJson.version}-${env.BUILD_NUMBER}.vsix"
    sh "sha256sum *.vsix > knative-${packageJson.version}-${env.BUILD_NUMBER}.vsix.sha256"
    sh "npm pack && mv vscode-knative-${packageJson.version}.tgz knative-${packageJson.version}-${env.BUILD_NUMBER}.tgz"
    sh "sha256sum *.tgz > knative-${packageJson.version}-${env.BUILD_NUMBER}.tgz.sha256"
  }

  if(params.UPLOAD_LOCATION) {
    stage('Snapshot') {
      def filesToPush = findFiles(glob: '**.vsix')
      sh "rsync -Pzrlt --rsh=ssh --protocol=28 *.vsix* ${UPLOAD_LOCATION}/snapshots/vscode-knative/"
    }
  }

  if(publishToMarketPlace.equals('true')){
    timeout(time:5, unit:'DAYS') {
      input message:'Approve deployment?', submitter: 'jowilson'
    }

    stage("Publish to Marketplace") {
      withCredentials([[$class: 'StringBinding', credentialsId: 'vscode_java_marketplace', variable: 'TOKEN']]) {
          def vsix = findFiles(glob: '**.vsix')
          sh 'vsce publish -p ${TOKEN} --packagePath' + " ${vsix[0].path}"
      }

      stage "Promote the build to stable"
      sh "rsync -Pzrlt --rsh=ssh --protocol=28 *.vsix* ${UPLOAD_LOCATION}/stable/vscode-knative/"
      sh "rsync -Pzrlt --rsh=ssh --protocol=28 *.tgz* ${UPLOAD_LOCATION}/stable/vscode-knative/"
      archive includes:"**.vsix*,**.tgz*"
    }
  }
}
