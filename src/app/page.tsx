'use client';
import { useState, useCallback, useEffect } from 'react';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
/** 
 * PDF Rendering requires react-pdf
 */
import { useResizeObserver } from '@wojtekmaj/react-hooks';
import { pdfjs, Document, Page } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import type { PDFDocumentProxy } from 'pdfjs-dist';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;


const options = {
  cMapUrl: '/cmaps/',
  standardFontDataUrl: '/standard_fonts/',
};

const resizeObserverOptions = {};

const maxWidth = 800;

type PDFFile = File | null;


export default function Home() {
  /**
   * PDF file state
   * 
   * 
   */
  const [file, setFile] = useState<PDFFile>(null);
  const [numPages, setNumPages] = useState<number>();
  const [containerRef, setContainerRef] = useState<HTMLElement | null>(null);
  const [containerWidth, setContainerWidth] = useState<number>();

  const onResize = useCallback<ResizeObserverCallback>((entries) => {
    const [entry] = entries;

    if (entry) {
      setContainerWidth(entry.contentRect.width);
    }
  }, []);

  useResizeObserver(containerRef, resizeObserverOptions, onResize);

  function onFileChange(event: React.ChangeEvent<HTMLInputElement>): void {
    const { files } = event.target;

    if (files && files[0]) {
      setFile(files[0] || null);
    }
  }

  function onDocumentLoadSuccess({ numPages: nextNumPages }: PDFDocumentProxy): void {
    setNumPages(nextNumPages);
  }

  const createPdf = async () => {
    const pdfDoc = await PDFDocument.create()
    const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman)

    const page = pdfDoc.addPage([350, 400])
    page.setFont(timesRomanFont)
    page.setFontSize(30)
    page.drawText('Creating PDFs from JS is awesome!', {
      x: 50,
      y: 350,
      color: rgb(0, 0, 0),
    });
    // add /vercel.svg to the pdf
    const vercelSvgUrl = '/firma.png'
    const vercelSvg = await fetch(vercelSvgUrl).then((res) => res.arrayBuffer())
    const vercelImage = await pdfDoc.embedPng(vercelSvg)
    page.drawImage(vercelImage, {
      x: 50,
      y: 50,
      width: 100,
      height: 100,
    });
    const pdfBytes = await pdfDoc.save();
    // pdfBytes to a File object
    const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });
    const pdfFile = new File([pdfBlob], 'vercel.pdf', { type: 'application/pdf' });
    console.log(pdfFile)
    setFile(pdfFile)
    return pdfBytes
  };

  const downloadPdf = async () => {
    const pdfBytes = await createPdf()
    const blob = new Blob([pdfBytes], { type: 'application/pdf' })
    const link = document.createElement('a')
    link.href = window.URL.createObjectURL(blob)
    link.download = 'vercel.pdf'
    link.click()
  };

  // redenr createPdf and downloadPdf
  useEffect(() => {
    createPdf()
    //downloadPdf()
  }, []);

  return (
    <div className="Example">
      <header>
        <h1>react-pdf sample page</h1>
      </header>
      <div className="Example__container">
        <div className="Example__container__load">
          <label htmlFor="file">Load from file:</label>{' '}
          <input onChange={onFileChange} type="file" />
        </div>
        <div className="Example__container__document" ref={setContainerRef}>
          <Document file={file} onLoadSuccess={onDocumentLoadSuccess} options={options}>
            {Array.from(new Array(numPages), (el, index) => (
              <Page
                key={`page_${index + 1}`}
                pageNumber={index + 1}
                width={containerWidth ? Math.min(containerWidth, maxWidth) : maxWidth}
              />
            ))}
          </Document>
        </div>
      </div>
    </div>
  );  
}
