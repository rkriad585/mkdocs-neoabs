# Copyright (c) 2025 mkdocs-neoabs contributors

# Permission is hereby granted, free of charge, to any person obtaining a copy
# of this software and associated documentation files (the "Software"), to
# deal in the Software without restriction, including without limitation the
# rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
# sell copies of the Software, and to permit persons to whom the Software is
# furnished to do so, subject to the following conditions:

# The above copyright notice and this permission notice shall be included in
# all copies or substantial portions of the Software.

# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
# IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
# FITNESS FOR A PARTICULAR PURPOSE AND NON-INFRINGEMENT. IN NO EVENT SHALL THE
# AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
# LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
# FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
# IN THE SOFTWARE.

import warnings


# MkDocs 2.0 compatibility warning
def is_mkdocs():
    try:
        import mkdocs

        return True
    except ImportError:
        return False


if is_mkdocs():
    try:
        from mkdocs import version_tuple

        if version_tuple >= (2, 0):
            warnings.warn(
                "mkdocs-neoabs: MkDocs 2.0 introduced breaking changes. "
                "Please refer to the migration guide.",
                stacklevel=2,
            )
    except (ImportError, AttributeError):
        pass
