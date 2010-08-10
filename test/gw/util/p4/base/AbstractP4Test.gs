package gw.util.p4.base

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

  static final var P4D_NAME = "p4d-2009.2"
  static final var P4D_LOCATION = "/opt/perforce"

  static var _tmpDir = new File(System.getProperty("java.io.tmpdir"), "p4test")
  static var _clientRoot = new File(_tmpDir, "client")
  static var _p4 : P4Client as P4
  static var _uniqueFileCounter = 0

  static var _fileMover : FileMover

  construct() {
    this(new IntegDeleteFileMover(this))
  }

  construct(fileMover : FileMover) {
    _fileMover = fileMover
  }

  override function beforeTestClass() {
    super.beforeTestClass()

    var serverHost = "localhost"
    var serverPort = 99999 // nonprivileged port so it doesn't require root
    var serverRoot = new File(_tmpDir, "server")
    var client = "P4TestClient"

    // Kill any previously running server
    try {
      Shell.exec("killall ${P4D_NAME}")

      // the following technique is shown here and commented out to show
      // we should NOT do it this way.  It's too risky - with the wrong environment
      // variables, you could accidentally shut down our production p4 server.

      //Shell.buildProcess("p4 admin stop")
      //  .withStdErrHandler(new ProcessStarter.NullOutputHandler())
      //  .exec()
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
    var process = Shell.buildProcess("${P4D_LOCATION}/${P4D_NAME} -d")
    process.Environment["P4ROOT"] = serverRoot.Path
    process.Environment["P4PORT"] = serverPort as String
    process.start()
    print("Waiting 2 seconds for daemon to restart...")
    Thread.sleep(2000)

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
    return _fileMover.moveFileAndSubmit(fromFile, toFile)
  }

  function moveFile(fromFile : File, toFile : File) {
    _fileMover.moveFile(fromFile, toFile)
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
