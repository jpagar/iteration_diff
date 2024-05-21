import React, { FC, useRef, useState } from 'react';
import { Buffer } from 'buffer';
import { parse } from 'csv-parse/browser/esm';
import * as xlsx from 'xlsx';
import { CopyIcon } from 'lucide-react';

import { Button } from '@/components/ui/button.tsx';
import { Input } from '@/components/ui/input.tsx';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table.tsx';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip.tsx';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert.tsx';
import { toast } from 'react-toastify';

import _ from 'lodash';

interface IterationFile {
  ID: string;
  Title: string;
  'Assigned To': string;
  'DEV Tester': string;
  'QA Tester': string;
  State: string;
  Escalation: string;
  TargetDate: string;
  FleetTracking: string;
  MondayComID: string;
}

function App() {
  const openOriginalList = useRef<HTMLInputElement>(null);
  const openNewList = useRef<HTMLInputElement>(null);

  const [originalList, setOriginalList] = useState<IterationFile[]>([]);
  const [newList, setNewList] = useState<IterationFile[]>([]);
  const [fileNames, setFileNames] = useState<string[]>([]);
  const [comparisonResults, setComparisonResults] = useState<{
    removedItems: IterationFile[];
    addedItems: IterationFile[];
    matchingItems: IterationFile[];
  }>({ removedItems: [], addedItems: [], matchingItems: [] });

  const handleClickOriginal = () => {
    if (openOriginalList.current) {
      openOriginalList.current.click();
    }
  };
  const handleClickNew = () => {
    if (openNewList.current) {
      openNewList.current.click();
    }
  };
  const originalFileList = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    // @ts-ignore
    setFileNames((prev) => [...prev, e.target.files[0].name]);

    let file = e.target.files[0];
    const reader = new FileReader();

    reader.onload = (event) => {
      const data = event.target?.result as ArrayBuffer;
      const buffer = Buffer.from(data);

      const records: IterationFile[] = [];

      if (file.name.endsWith('.csv')) {
        parse(
          buffer,
          {
            columns: true,
            skip_empty_lines: true,
            trim: true,
            bom: true
          },
          (err, parsedData) => {
            if (err) {
              console.error('Error parsing the file:', err);
              return;
            }

            for (const record of parsedData) {
              records.push(record);
            }
            setOriginalList(records);
          }
        );
      } else if (file.name.endsWith('xlsx') || file.name.endsWith('xls')) {
        const workbook = xlsx.read(new Uint8Array(data), { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonRecords: IterationFile[] = xlsx.utils.sheet_to_json(worksheet);
        setOriginalList(jsonRecords);
      }

    };

    reader.readAsArrayBuffer(file);
  };
  const modifiedFileList = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    // @ts-ignore
    setFileNames((prev) => [...prev, e.target.files[0].name]);

    let file = e.target.files[0];
    const reader = new FileReader();

    reader.onload = (event) => {
      const data = event.target?.result as ArrayBuffer;
      const buffer = Buffer.from(data);

      const records: IterationFile[] = [];

      if (file.name.endsWith('.csv')) {
        parse(
          buffer,
          {
            columns: true,
            skip_empty_lines: true,
            trim: true,
            bom: true
          },
          (err, parsedData) => {
            if (err) {
              console.error('Error parsing the file:', err);
              return;
            }

            for (const record of parsedData) {
              records.push(record);
            }
            setNewList(records);
          }
        );
      } else if (file.name.endsWith('xlsx') || file.name.endsWith('xls')) {
        const workbook = xlsx.read(new Uint8Array(data), { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonRecords: IterationFile[] = xlsx.utils.sheet_to_json(worksheet);
        setNewList(jsonRecords);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const compareLists = (
    original: IterationFile[],
    newList: IterationFile[]
  ) => {
    const removedItems = _.differenceBy(original, newList, 'ID');
    const addedItems = _.differenceBy(newList, original, 'ID');
    const matchingItems = _.intersectionBy(original, newList, 'ID');

    console.log(removedItems);
    console.log(addedItems);
    console.log(matchingItems);

    setComparisonResults({
      removedItems: removedItems,
      addedItems: addedItems,
      matchingItems: matchingItems
    });
  };

  console.log('Removed Items: ', comparisonResults.removedItems);
  console.log('Added Items: ', comparisonResults.addedItems);
  console.log('Matching Items: ', comparisonResults.matchingItems);
  return (
    <>
      <div className="flex gap-2 justify-center mt-6">
        <Button className="mb-2" onClick={handleClickOriginal}>
          Import Original List
        </Button>
        <Input
          ref={openOriginalList}
          onChange={originalFileList}
          type="file"
          className="hidden"
        />
        <Button className="mb-2" onClick={handleClickNew}>
          Import New List
        </Button>
        <Input
          ref={openNewList}
          onChange={modifiedFileList}
          type="file"
          className="hidden"
        />
        <Button onClick={() => compareLists(originalList, newList)}>
          Compare
        </Button>
        <Button onClick={() => window.location.reload()}>
          Clear
        </Button>
      </div>
      <Alert className="container">
        <AlertTitle className="underline">Files being compared:</AlertTitle>
        <AlertDescription className="">
          <div className="flex flex-col gap-2">
            {originalList.length > 0 ? (
              <p>
                <span className="font-semibold mr-2">Original List:</span>
                {fileNames[0]}
              </p>
            ) : null}
            {newList.length > 0 ? (
              <p>
                <span className="font-semibold mr-2">New List:</span>
                {fileNames[1]}
              </p>
            ) : null}
          </div>
        </AlertDescription>
      </Alert>
      <TableResults
        data={comparisonResults.removedItems}
        caption="Items Removed"
        onClick={() => copyTableToClipboard(comparisonResults.removedItems, 'Items Removed')}
      />
      <TableResults
        data={comparisonResults.addedItems}
        caption="Items Added"
        onClick={() => copyTableToClipboard(comparisonResults.addedItems, 'Items Added')}
      />
      <TableResults
        data={comparisonResults.matchingItems}
        caption="Matching Items"
        onClick={() => copyTableToClipboard(comparisonResults.matchingItems, 'Matching Items')}
      />
    </>
  );
}

const copyToClipboard = (value: string) => {
  navigator.clipboard.writeText(value).then(() => {
    toast.success(`${value} copied!`, {
      position: 'top-right',
      autoClose: 3000,
      pauseOnHover: true,
      hideProgressBar: false,
      closeOnClick: true,
      theme: 'colored'
    });
  });
};

const copyTableToClipboard = (data: IterationFile[], caption: string) => {
  const headers = ['ID', 'Title', 'Assigned To', 'DEV Tester', 'QA Tester', 'State', 'Escalation', 'Target Date', 'FleetTracking', 'MondayCom ID'];
  const headersString = headers.join('\t');

  const tableString = data.map((item: IterationFile) =>
    `${item.ID}\t${item.Title}\t${item['Assigned To'] || ''}\t${item['DEV Tester'] || ''}\t${item['QA Tester'] || ''}\t${item.State || ''}\t${item.Escalation || ''}\t${item.TargetDate || ''}\t${item.FleetTracking || ''}\t${item.MondayComID || ''}`
  ).join('\n');

  const fullTableString = headersString + '\n' + tableString;

  navigator.clipboard.writeText(fullTableString).then(() => {
    toast.success(`${caption} table copied!`, {
      position: 'top-right',
      autoClose: 3000,
      pauseOnHover: true,
      hideProgressBar: false,
      closeOnClick: true,
      theme: 'colored'
    });
  });
};

interface TableProps {
  data: IterationFile[];
  caption: string;
  onClick?: () => void;
}

const TableResults: FC<TableProps> = ({ data, caption, onClick }) => {
  return (
    <div className="mx-2">
      <h2
        className="text-lg font-bold underline underline-offset-4 mt-6 mb-4 cursor-pointer"
        onClick={onClick}
      >
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>{caption}</TooltipTrigger>
            <TooltipContent>
              <p>Click here to copy {caption}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </h2>
      <Table>
        <TableHeader className="bg-[#133157]">
          <TableRow>
            <TableHead className="text-white/80 font-bold">ID</TableHead>
            <TableHead className="text-white/80 font-bold">Title</TableHead>
            <TableHead className="text-white/80 font-bold">Assigned To</TableHead>
            <TableHead className="text-white/80 font-bold">DEV Tester</TableHead>
            <TableHead className="text-white/80 font-bold">QA Tester</TableHead>
            <TableHead className="text-white/80 font-bold">State</TableHead>
            <TableHead className="text-white/80 font-bold">Escalation</TableHead>
            <TableHead className="text-white/80 font-bold">Target Date</TableHead>
            <TableHead className="text-white/80 font-bold">FleetTracking</TableHead>
            <TableHead className="text-white/80 font-bold">MondayCom ID</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item) => (
            <>
              <TableRow key={item.ID}>
                <TableCell
                  onClick={() => copyToClipboard(item.ID)}
                  className="font-medium cursor-pointer hover:bg-muted/50 text-right"
                >
                  <div className="flex gap-2">{item.ID}</div>
                </TableCell>
                <TableCell
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => copyToClipboard(item.Title)}
                >
                  {item.Title}
                </TableCell>
                <TableCell
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => copyToClipboard(item['Assigned To'])}
                >
                  {item['Assigned To']}
                </TableCell>
                <TableCell
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => copyToClipboard(item['DEV Tester'])}
                >
                  {item['DEV Tester']}
                </TableCell>
                <TableCell
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => copyToClipboard(item['QA Tester'])}
                >
                  {item['QA Tester']}
                </TableCell>
                <TableCell
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => copyToClipboard(item.State)}
                >
                  {item.State}
                </TableCell>
                <TableCell
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => copyToClipboard(item.Escalation ? item.Escalation : '')}
                >
                  {item.Escalation}
                </TableCell>
                <TableCell
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => copyToClipboard(item.TargetDate)}
                >
                  {item.TargetDate}
                </TableCell>
                <TableCell
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => copyToClipboard(item.FleetTracking)}
                >
                  {item.FleetTracking}
                </TableCell>
                <TableCell
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => copyToClipboard(item.MondayComID)}
                >
                  {item.MondayComID}
                </TableCell>
                <TableCell
                  onClick={() => copyToClipboard(`${item.ID} - ${item.Title}`)}
                >
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <CopyIcon className="cursor-pointer hover:text-zinc-600" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-sm font-medium">Copy ID and Title</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableCell>
              </TableRow>
            </>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default App;
