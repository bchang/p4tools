package com.github.bchang.p4.base

uses gw.test.TestClass
uses java.io.File
uses java.lang.System
uses gw.util.Shell
uses java.lang.Thread
uses java.lang.Integer
uses java.util.regex.Pattern
uses gw.util.CommandFailedException
uses java.lang.StringBuilder

abstract class AbstractP4Test extends TestClass {

  static var _tmpDir = new File(System.getProperty("java.io.tmpdir"), "p4test")
  static var _clientRoot = new File(_tmpDir, "client")
  static var _p4 : P4Client as P4
  static var _uniqueFileCounter = 0

  construct() {
  }

  override function beforeTestClass() {
    super.beforeTestClass()

    var p4dPath = java.lang.System.getenv()["P4D"]
    if (p4dPath == null) {
      throw "please set an environment variable P4D pointing to your p4d executable"
    }
    var p4d = new File(p4dPath)

    var serverHost = "localhost"
    var serverPort = 9999 // nonprivileged port so it doesn't require root
    var serverRoot = new File(_tmpDir, "server")
    var client = "P4TestClient"

    // Kill any previously running server
    try {
      Shell.exec("killall ${p4d.Name}")

      print("Waiting 1 second for daemon to die...")
      Thread.sleep(1000)
    }
    catch (e : CommandFailedException) {
      // there wasn't a p4d process running - ignore
    }

    _tmpDir.deleteRecursively()
    if (_tmpDir.exists()) {
      throw "did not successfully delete ${_tmpDir}"
    }

    // Start server
    serverRoot.mkdirs()
    var process = Shell.buildProcess("${p4d} -d")
    process.Environment["P4ROOT"] = serverRoot.Path
    process.Environment["P4PORT"] = serverPort as String
    process.start()

    print("Waiting 1 seconds for daemon to start...")
    Thread.sleep(1000)

    // Create one client
    _p4 = P4Factory.createP4(serverHost, serverPort, client, null, true, true)
    _clientRoot.mkdirs()
  }

  override function beforeTestMethod() {
    super.beforeTestMethod()
    _p4.User = "testuser"
    saveClient()
    _p4.clearStats()
  }

  function saveClient() {
    var clientspec = "Client: ${_p4.Client}\n" +
      "Owner: ${_p4.User}\n" +
      "Host: \n" +
      "Description:\n" +
      "  Default client for P4Test environment\n" +
      "Root: ${_clientRoot.Path}\n" +
      "Options: noallwrite noclobber nocompress unlocked nomodtime normdir\n" +
      "SubmitOptions: submitunchanged\n" +
      "LineEnd: local\n" +
      "View:\n" +
      "  //depot/... //${_p4.Client}/...\n"
    print(p4Impl("client -i", clientspec))
  }

  function newBranch(branchName : String, desc : String, view : String) {
    var spec = "Branch: ${branchName}\n" +
      "Owner: ${_p4.User}\n" +
      "Description:\n" +
      "  ${desc}\n" +
      "View:\n" +
      "  ${view}\n"
    print(p4Impl("branch -i", spec))
  }

  function newChange(desc : String) : int {
    var spec = "Change: new\n" +
      "Client: ${_p4.Client}\n" +
      "User: ${_p4.User}\n" +
      "Status: new\n" +
      "Description:\n" +
      "  ${desc}\nFiles:\n"
    var cmdOutput = p4Impl("change -i", spec)
    var matcher = Pattern.compile("^Change (\\d+) .*").matcher(cmdOutput)
    return matcher.matches() ? Integer.parseInt(matcher.group(1)) : 0
  }

  function createFileAndSubmit(file : File, content : String) : int {
    createFile(file, content)
    return submit({file}, "test added file")
  }

  function createFile(file : File, content : String) {
    print("Test creating and adding ${file.Path}")
    file.write(content)
    print(p4Impl("add \"${file.Path}\"").trim())
  }

  function appendToFileAndSubmit(file : File, appendContent : String) : int {
    appendToFile(file, appendContent)
    return submit({file}, "test appended to file")
  }

  function appendToFile(file : File, appendContent : String) {
    print("Test appending to ${file.Path}")
    print(p4Impl("edit \"${file.Path}\"").trim())
    var content = file.read() + appendContent
    file.write(content)
  }

  function editFileAndSubmit(file : File, content : String) : int {
    editFile(file, content)
    return submit({file}, "test edited file")
  }

  function editFile(file : File, content : String) {
    print("Test editing ${file.Path}")
    print(p4Impl("edit \"${file.Path}\"").trim())
    file.write(content)
  }

  function integFileAndSubmit(fromFile : File, toFile : File) : int {
    integFile(fromFile, toFile)
    return submit({toFile}, "test integrated file")
  }

  function integFile(fromFile : File, toFile : File) {
    print("Test integrating ${fromFile.Path} to ${toFile.Path}")
    print(p4Impl("integ \"${fromFile.Path}\" \"${toFile.Path}\"").trim())
    print("Test resolving ${toFile.Path}")
    print(p4Impl("resolve -a \"${toFile.Path}\"").trim())
  }

  function integDirAndSubmit(fromDir : File, toDir : File) : int {
    integDir(fromDir, toDir)
    return submitDir({toDir}, "test integrated dir")
  }

  function integDir(fromDir : File, toDir : File) {
    print("Test integrating ${fromDir.Path}/... to ${toDir.Path}/...")
    print(p4Impl("integ \"${fromDir.Path}/...\" \"${toDir.Path}/...\"").trim())
    print("Test resolving ${toDir.Path}/...")
    print(p4Impl("resolve -a \"${toDir.Path}/...\"").trim())
  }

  function moveFileAndSubmit(fromFile : File, toFile : File) : int {
    moveFile(fromFile, toFile)
    return submit({fromFile, toFile}, "test moved file")
  }

  function moveFile(fromFile : File, toFile : File) {
    print("Test moving ${fromFile.Path} to ${toFile.Path}")
    print(p4Impl("edit \"${fromFile.Path}\""))
    print(p4Impl("move \"${fromFile.Path}/...\" \"${toFile.Path}/...\"").trim())
  }

  function deleteFileAndSubmit(file : File) : int {
    deleteFile(file)
    return submit({file}, "test deleted file")
  }

  function deleteFile(file : File) {
    print("Test deleting ${file.Path}")
    print(p4Impl("delete \"${file.Path}\"").trim())
  }

  function p4(cmd : String) {
    print("Test running custom command '${cmd}'")
    print(p4Impl(cmd).trim())
  }

  function submit(files : List<File>, desc : String) : int {
    print("Test submitting files " + files)
    var changeNum = newChange(desc)
    for (file in files) {
      p4Impl("reopen -c ${changeNum} \"${file.Path}\"")
    }
    print(p4Impl("submit -c ${changeNum}").trim())
    return changeNum
  }

  function submitDir(dirs : List<File>, desc : String) : int {
    print("Test submitting dirs " + dirs)
    var changeNum = newChange(desc)
    for (dir in dirs) {
      p4Impl("reopen -c ${changeNum} \"${dir.Path}/...\"")
    }
    print(p4Impl("submit -c ${changeNum}").trim())
    return changeNum
  }

  function newUniqueFile() : File {
    return newUniqueFile(_clientRoot)
  }

  function newUniqueFile(dir : File) : File {
    return newUniqueFile(dir, Type.RelativeName)
  }

  function newUniqueFile(dir : File, namePrefix : String) : File {
    _uniqueFileCounter++
    return new File(dir, "${namePrefix}${_uniqueFileCounter}.txt")
  }

  function newClientFile(relPath : String) : File {
    return new File(_clientRoot, relPath)
  }


  private function p4Impl(op : String) : String {
    return _p4.run(op)
  }

  private function p4Impl(op : String, input : String) : String {
    var out = new StringBuilder()
    _p4.run(op, \ proc ->{
      proc.write(input)
      proc.closeStdin()

      // this is retarded...
      out.append(proc.readLine())
      var stderrLine = proc.readStderrLine()
      if (stderrLine != null and stderrLine.length() > 0) {
        print(stderrLine)
      }
    })
    return out.toString()
  }
}
