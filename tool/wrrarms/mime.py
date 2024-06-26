# Copyright (c) 2024 Jan Malakhovski <oxij@oxij.org>
#
# This file is a part of pwebarc project.
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with this program. If not, see <http://www.gnu.org/licenses/>.

"""MIME types normalization and sniffing.

  In general, this follows https://mimesniff.spec.whatwg.org/ but
  usually does more than mimesniff requires.
"""

import email.headerregistry as _emlhr
import re as _re
import typing as _t

_registry = _emlhr.HeaderRegistry()

def normalize_content_type(header : str) -> tuple[set[str] | None, str, str | None, list[str]]:
    """Parse and normalize "Content-type" header.

       Returns (possible essenses | None, mime type, charset | None).
    """

    ct_reg = _registry("content-type", header)
    ctt = ct_reg.content_type.lower() # type: ignore
    charset = None
    for name, value in ct_reg._parse_tree.params: # type: ignore
        if name == "charset":
            charset = value

    if header in ["text/plain", "text/plain; charset=ISO-8859-1",
                  "text/plain; charset=iso-8859-1", "text/plain; charset=UTF-8"]:
        # this "Content-type" header was likely generated by a buggy
        # Apache, see https://mimesniff.spec.whatwg.org/ force content
        # sniffing by returning
        return None, ctt, charset, []
    elif ctt == "text/plain":
        return set(["text"]), ctt, charset, [".txt"]
    elif ctt == "text/html":
        return set(["html", "text"]), ctt, charset, [".htm", ".html"]
    elif ctt == "text/css":
        return set(["css", "text"]), ctt, charset, [".css"]
    elif ctt in ["application/ecmascript", "application/javascript", "application/x-ecmascript",
                 "application/x-javascript", "text/ecmascript", "text/javascript",
                 "text/javascript1.0", "text/javascript1.1", "text/javascript1.2",
                 "text/javascript1.3", "text/javascript1.4", "text/javascript1.5",
                 "text/jscript", "text/livescript", "text/x-ecmascript",
                 "text/x-javascript"]:
        return set(["javascript", "text"]), "application/javascript", charset, [".js"]
    elif ctt == "image/svg+xml":
        return set(["image", "xml", "text"]), ctt, charset, [".svg"]
    elif ctt == "image/gif":
        return set(["image"]), ctt, charset, [".gif"]
    elif ctt == "image/webp":
        return set(["image"]), ctt, charset, [".webp"]
    elif ctt == "image/png":
        return set(["image"]), ctt, charset, [".png"]
    elif ctt == "image/jpeg":
        return set(["image"]), ctt, charset, [".jpg", ".jpeg"]
    elif ctt.startswith("image/"):
        return set(["image"]), ctt, charset, []
    elif ctt == "application/ogg":
        # ogg can contain both audio and video, or either, hence "media"
        return set(["media", "audio", "video"]), ctt, charset, [".ogg"]
    elif ctt == "audio/mpeg":
        return set(["audio"]), ctt, charset, [".mp3"]
    elif ctt == "audio/aiff":
        return set(["audio"]), ctt, charset, [".aif", ".aiff", ".aifc"]
    elif ctt == "audio/midi":
        return set(["audio"]), ctt, charset, [".mid", ".midi"]
    elif ctt == "audio/wave":
        return set(["audio"]), ctt, charset, [".wav", ".pcm"]
    elif ctt.startswith("audio/"):
        return set(["audio"]), ctt, charset, []
    elif ctt == "video/avi":
        return set(["video"]), ctt, charset, [".avi"]
    elif ctt == "video/webm":
        return set(["video"]), ctt, charset, [".webm"]
    elif ctt == "video/mp4":
        return set(["video"]), ctt, charset, [".mp4"]
    elif ctt.startswith("video/"):
        return set(["video"]), ctt, charset, []
    elif ctt in ["application/font-cff",
                 "application/font-off",
                 "application/font-sfnt",
                 "application/font-ttf",
                 "application/vnd.ms-fontobject",
                 "application/vnd.ms-opentype"]:
        return set(["font"]), ctt, charset, [".ttf"]
    elif ctt == "application/font-woff":
        return set(["font"]), ctt, charset, [".woff"]
    elif ctt == "application/font-woff2":
        return set(["font"]), ctt, charset, [".woff2"]
    elif ctt == "application/pdf":
        return set(["dyndoc"]), ctt, charset, [".pdf"]
    elif ctt == "application/postscript":
        return set(["dyndoc"]), ctt, charset, [".ps"]
    elif ctt.endswith("+zip") or ctt in ["application/zip"]:
        # could be a EPub, hence "dyndoc"
        return set(["archive", "dyndoc"]), ctt, charset, [".zip", ".epub"]
    elif ctt in ["application/x-rar-compressed",
                 "application/x-rar",
                 "application/rar-compressed",
                 "application/rar"]:
        return set(["archive"]), "application/rar", charset, [".rar"]
    elif ctt in ["application/x-grip", "application/gzip"]:
        return set(["archive"]), "application/gzip", charset, [".gz", ".gzip"]
    elif ctt.endswith("+xml") or \
         ctt in ["text/xml", "application/xml"]:
        return set(["xml", "text"]), ctt, charset, [".xml"]
    elif ctt.endswith("+json") or \
         ctt in ["application/json", "text/json"]:
        return set(["json", "text"]), ctt, charset, [".json"]

    return set(), ctt, charset, []

html_sniff_re = _re.compile(r"^\s*<(?:!--|!doctype html|html|head|script|iframe|h1|div|font|table|a|style|title|b|body|br|p)( |>)", flags=_re.IGNORECASE)
svg_sniff_re = _re.compile(r"^\s*(?:<\?xml\s[^>]*>\s*)?<svg", flags=_re.IGNORECASE)
xml_sniff_re = _re.compile(r"^\s*<\?xml", flags=_re.IGNORECASE)

unknown_binary = set(["unknown", "image", "audio", "video", "media", "font", "dyndoc", "archive"])
any_text = set(["text", "css", "javascript", "json"])

DiscernContentType = tuple[set[str], str, str | None, list[str]]

def sniff_mime_type(data : str | bytes, charset : str | None) -> DiscernContentType:
    """Sniff MIME type value from given file content or file content prefix.

       Returns (possible essenses, mime type, charset | None).
    """

    if isinstance(data, bytes):
        # image
        if data.startswith(b"GIF87a") and data.startswith(b"GIF89a"):
            return set(["image"]), "image/gif", None, [".gif"]
        elif data.startswith(b"RIFF") and data[8:14] == b"WEBPVP":
            return set(["image"]), "image/webp", None, [".webp"]
        elif data.startswith(b"\x89PNG\x0d\x0a\x1a\x0a"):
            return set(["image"]), "image/png", None, [".png"]
        elif data.startswith(b"\xff\xd8\xff") and data[6:10] == b"JFIF":
            return set(["image"]), "image/jpeg", None, [".jpg", ".jpeg"]
        # audio and video
        elif data.startswith(b"FORM") and data[8:12] == b"AIFF":
            return set(["audio"]), "audio/aiff", None, [".aiff", ".aif", ".aifc"]
        elif data.startswith(b"ID3"):
            return set(["audio"]), "audio/mpeg", None, [".mp3"]
        elif data.startswith(b"OggS\x00"):
            return set(["media", "audio", "video"]), "application/ogg", None, [".ogg"]
        elif data.startswith(b"MThd\x00\x00\x00\x06"):
            return set(["audio"]), "audio/midi", None, [".mid", ".midi"]
        elif data.startswith(b"RIFF") and data[8:12] == b"WAVE":
            return set(["audio"]), "audio/wave", None, [".wav", ".pcm"]
        elif data.startswith(b"RIFF") and data[8:12] == b"AVI ":
            return set(["video"]), "video/avi", None, [".avi"]
        # fonts
        elif data.startswith(b"OTTO"):
            return set(["font"]), "font/otf", None, [".ttf"]
        elif data.startswith(b"ttcf"):
            return set(["font"]), "font/collection", None, [".ttf"]
        elif data.startswith(b"wOFF"):
            return set(["font"]), "font/woff", None, [".woff"]
        elif data.startswith(b"wOF2"):
            return set(["font"]), "font/woff2", None, [".woff2"]
        # documents
        elif data.startswith(b"%PDF-"):
            return set(["dyndoc"]), "application/pdf", None, [".pdf"]
        elif data.startswith(b"%!PS-Adobe-"):
            return set(["dyndoc"]), "application/postscript", None, [".ps"]
        # archives
        elif data.startswith(b"\x1f\x8b\x08"):
            return set(["archive"]), "application/gzip", None, [".gz", ".gzip"]
        elif data.startswith(b"PK\x03\x04"):
            # could be a EPub, hence "dyndoc"
            return set(["archive", "dyndoc"]), "application/zip", None, [".zip", ".epub", ".apk"]
        elif data.startswith(b"Rar \x1a\x07\x00"):
            return set(["archive"]), "application/rar", None, [".rar"]
        # now, less certain
        # image
        elif data.startswith(b"\x00\x00\x01\x00") or data.startswith(b"\x00\x00\x02\x00"):
            return set(["image", "unknown"]), "image/x-icon", None, [".ico"]
        elif data.startswith(b"BM"):
            return set(["image", "unknown"]), "image/bmp", None, [".bmp"]
        elif data.startswith(b"\xff\xd8\xff"):
            return set(["image", "unknown"]), "image/jpeg", None, [".jpg", ".jpeg"]
        # font
        elif data.startswith(b"\x00\x01\x00\x00"):
            return set(["font", "unknown"]), "font/ttf", None, [".ttf"]
        elif data[34:36] == b"LP":
            return set(["font", "unknown"]), "application/vnd.ms-fontobject", None, [".ttf"]

        # TODO mp3 and mp4 headers

        # text
        if charset is not None:
            # try the specified charset first
            try:
                data = data.decode(charset)
            except UnicodeDecodeError:
                # it's a lie
                charset = None

        if charset is None:
            assert type(data) is bytes

            # detect BOM marks
            if data.startswith(b"\xef\xbb\xbf"):
                charset = "utf-8"
            elif data.startswith(b"\xff\xfe"):
                charset = "utf-16le"
            elif data.startswith(b"\xfe\xff"):
                charset = "utf-16be"

            if charset is not None:
                # try decoding the final time
                try:
                    data = data.decode(charset)
                except UnicodeDecodeError:
                    return unknown_binary, "application/octet-stream", None, []
            else:
                if data.find(b"\x00") != -1:
                    # unknown binary data
                    return unknown_binary, "application/octet-stream", None, []

                # this appears to be text data in some unknown encoding,
                # decode into ascii with replacements so that we could
                # match it to detect markup via regexps below
                data = data.decode("ascii", "replace")
                # TODO: detect pure ascii and UTF-8 without replacements here too?

    assert type(data) is str

    if svg_sniff_re.match(data):
        return set(["image", "xml", "text"]), "image/svg+xml", charset, [".svg"]
    elif xml_sniff_re.match(data):
        return set(["xml", "text"]), "text/xml", charset, [".xml"]
    elif html_sniff_re.match(data):
        return set(["html", "text"]), "text/html", charset, [".htm", ".html"]

    return any_text, "text/plain", charset, []

def discern_content_type(ct : str | None, sniff : bool, paranoid : bool, data : str | bytes) \
    -> DiscernContentType:
    """Given `Content-type` HTTP header, sniff and paranoid flags, and actual content body,
       return (possible essenses, mime type, charset | None).
    """

    extensions : list[str]
    if ct is None:
        essence, mime, charset, extensions = None, "application/octet-stream", None, []
    else:
        essence, mime, charset, extensions = normalize_content_type(ct)

    if essence is None:
        essence, mime, charset, extensions = sniff_mime_type(data, charset)
    elif sniff or paranoid:
        essence_, mime_, charset_, extensions_ = sniff_mime_type(data, charset)
        iessence = essence.intersection(essence_)
        if len(iessence) > 0:
            # sniffer and HTTP headers agree
            if not paranoid:
                # intersect
                essence = iessence
                extensions = [e for e in extensions if e in extensions_]
            else:
                # union
                essence.update(essence_)
                extensions += [e for e in extensions_ if e not in extensions]
            # use server's MIME
        else:
            # sniffer and HTTP headers disagree, take a union of all possible
            # interpretations
            essence.update(essence_)
            extensions += [e for e in extensions_ if e not in extensions]
            # use ours
            mime = mime_
        # sniffed charset always wins
        # TODO: make them a list too
        charset = charset_ or charset

    return essence, mime, charset, extensions
