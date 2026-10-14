// Python helpers loaded into every Pyodide runtime (the in-app worker and scripts/verify-python.mjs).
/**
 * Runs exercise tests one top-level statement at a time. When a bare `assert` fails (no message), it explains
 * the failure instead of a bare AssertionError: the failing line, and for `assert a == b` the expected and actual values.
 */
export const PY_TEST_HELPER = String.raw`
import ast as _dq_ast

def __dq_run_tests(src, ns):
    tree = _dq_ast.parse(src)
    lines = src.splitlines()
    for node in tree.body:
        code = compile(_dq_ast.Module(body=[node], type_ignores=[]), '<tests>', 'exec')
        try:
            exec(code, ns)
        except AssertionError as e:
            if str(e):
                raise
            raise AssertionError(__dq_explain(e, node, lines, ns)) from None

def __dq_explain(e, node, lines, ns):
    lineno = None
    tb = e.__traceback__
    while tb is not None:
        if tb.tb_frame.f_code.co_filename == '<tests>':
            lineno = tb.tb_lineno
        tb = tb.tb_next
    stmt = None
    for n in _dq_ast.walk(node):
        if isinstance(n, _dq_ast.Assert) and getattr(n, 'lineno', None) == lineno:
            stmt = n
    text = lines[lineno - 1].strip() if lineno else 'assert'
    nl = chr(10)
    detail = ''
    t = stmt.test if stmt is not None else None
    if isinstance(t, _dq_ast.Compare) and len(t.ops) == 1 and isinstance(t.ops[0], (_dq_ast.Eq, _dq_ast.Is)):
        try:
            got = eval(compile(_dq_ast.Expression(body=t.left), '<tests>', 'eval'), ns)
            want = eval(compile(_dq_ast.Expression(body=t.comparators[0]), '<tests>', 'eval'), ns)
            detail = nl + '  expected: ' + repr(want) + nl + '  got:      ' + repr(got)
        except Exception:
            pass
    return 'This check failed: ' + text + detail

import builtins as _dq_builtins

def __dq_set_stdin(text):
    # input() reads the exercise's typed lines and echoes them after the prompt, as a terminal shows them
    feed = [] if text is None else str(text).splitlines()
    feed.reverse()
    def _dq_input(prompt=''):
        prompt = str(prompt)
        if not feed:
            if prompt:
                print(prompt, end='')
            raise EOFError('EOF when reading a line' + (' (nothing is typed into input() in this run)' if text is None else ' (all of the typed input has been read)'))
        line = feed.pop()
        print(prompt + line)
        return line
    _dq_builtins.input = _dq_input

def __dq_reset():
    # Runs share one interpreter: undo global state an earlier run may have left behind
    import sys
    lg = sys.modules.get('logging')
    if lg is not None:
        root = lg.getLogger()
        for h in root.handlers[:]:
            root.removeHandler(h)
        root.setLevel(lg.WARNING)
        for logger in list(lg.Logger.manager.loggerDict.values()):
            if isinstance(logger, lg.Logger):
                logger.handlers.clear()
                logger.setLevel(lg.NOTSET)
                logger.disabled = False
                logger.propagate = True

def __dq_prepare(stdin):
    __dq_reset()
    __dq_set_stdin(stdin)
`;
