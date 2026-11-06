'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Link from '@tiptap/extension-link';
import { useEffect } from 'react';

interface RichTextEditorProps {
    content: string;
    onChange: (html: string) => void;
    dir?: 'rtl' | 'ltr';
    placeholder?: string;
}

export default function RichTextEditor({ content, onChange, dir = 'rtl', placeholder }: RichTextEditorProps) {
    const editor = useEditor({
        extensions: [
            StarterKit,
            Underline,
            TextAlign.configure({ types: ['heading', 'paragraph'] }),
            Link.configure({ openOnClick: false }),
        ],
        content,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: 'tiptap-content',
                dir,
                'data-placeholder': placeholder || '',
            },
        },
    });

    useEffect(() => {
        if (editor && content !== editor.getHTML()) {
            editor.commands.setContent(content || '');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [content]);

    if (!editor) return null;

    return (
        <div className="tiptap-editor-wrapper">
            {/* Toolbar */}
            <div className="tiptap-toolbar">
                <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={editor.isActive('bold') ? 'is-active' : ''} title="Bold">
                    <strong>B</strong>
                </button>
                <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={editor.isActive('italic') ? 'is-active' : ''} title="Italic">
                    <em>I</em>
                </button>
                <button type="button" onClick={() => editor.chain().focus().toggleUnderline().run()} className={editor.isActive('underline') ? 'is-active' : ''} title="Underline">
                    <u>U</u>
                </button>
                <button type="button" onClick={() => editor.chain().focus().toggleStrike().run()} className={editor.isActive('strike') ? 'is-active' : ''} title="Strikethrough">
                    <s>S</s>
                </button>

                <div className="sep" />

                <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={editor.isActive('heading', { level: 1 }) ? 'is-active' : ''}>
                    H1
                </button>
                <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={editor.isActive('heading', { level: 2 }) ? 'is-active' : ''}>
                    H2
                </button>
                <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={editor.isActive('heading', { level: 3 }) ? 'is-active' : ''}>
                    H3
                </button>

                <div className="sep" />

                <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={editor.isActive('bulletList') ? 'is-active' : ''} title="Bullet List">
                    • List
                </button>
                <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={editor.isActive('orderedList') ? 'is-active' : ''} title="Numbered List">
                    1. List
                </button>

                <div className="sep" />

                <button type="button" onClick={() => editor.chain().focus().setTextAlign('right').run()} className={editor.isActive({ textAlign: 'right' }) ? 'is-active' : ''} title="Right">
                    ⇉
                </button>
                <button type="button" onClick={() => editor.chain().focus().setTextAlign('center').run()} className={editor.isActive({ textAlign: 'center' }) ? 'is-active' : ''} title="Center">
                    ≡
                </button>
                <button type="button" onClick={() => editor.chain().focus().setTextAlign('left').run()} className={editor.isActive({ textAlign: 'left' }) ? 'is-active' : ''} title="Left">
                    ⇇
                </button>

                <div className="sep" />

                <button type="button" onClick={() => editor.chain().focus().toggleBlockquote().run()} className={editor.isActive('blockquote') ? 'is-active' : ''} title="Quote">
                    ❝
                </button>

                <button type="button" onClick={() => {
                    const url = window.prompt('URL:');
                    if (url) editor.chain().focus().setLink({ href: url }).run();
                }} className={editor.isActive('link') ? 'is-active' : ''} title="Link">
                    🔗
                </button>

                <button type="button" onClick={() => editor.chain().focus().unsetLink().run()} title="Remove Link">
                    ✂️
                </button>
            </div>

            {/* Editor Content */}
            <EditorContent editor={editor} />
        </div>
    );
}
