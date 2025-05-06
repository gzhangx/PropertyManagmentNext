import { Dispatch, SetStateAction, useRef, useState } from "react";


export interface ITagProps<T> {
    tags: T[];
    displayTags?: (tag: T) => string;
    onTagAdded: (tag: string) => void;
    onTagRemoved: (tag: T) => void;

    custHandleKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => boolean;
    custHandleClick?: (event: React.MouseEvent<HTMLInputElement>) => void;
    custAfterUIElement?: React.JSX.Element;

    //pass in if we need to control those
    setCurInputText?: Dispatch<SetStateAction<string>>
    curInputText?: string;
}
export function TagsInput<T>(props: ITagProps<T>) {
    const tagsUl = useRef<HTMLUListElement>(null);
    const [curInputTextLocal, setCurInputTextLocal] = useState('');
    const curInputText = props.curInputText ?? curInputTextLocal;
    const setCurInputText = props.setCurInputText ?? setCurInputTextLocal;
  return (
      <div className="tags-input">
          <ul ref={tagsUl}>
              { 
                  props.tags.map((tag, index) => {
                      return (
                          <li key={index}>
                              {props.displayTags ? props.displayTags(tag): tag as string}
                              <button className="delete-button" onClick={() => {                    
                                  // Call the onTagRemoved function passed as a prop
                                  props.onTagRemoved(tag);
                              }}>X</button>
                          </li>
                      );
                  })
              }
          </ul>
          <input type="text" 
              placeholder="Enter tag name"
              value={curInputText}
              onChange={e => {
                  setCurInputText(e.target.value);
              }}
              onClick={props.custHandleClick ? props.custHandleClick : () => { }}
              onKeyDown={function (event) { 
                  if (props.custHandleKeyDown) if (props.custHandleKeyDown(event)) return;
                  // Check if the key pressed is 'Enter'
                  if (event.key === 'Enter') {

                      // Prevent the default action of the keypress
                      // event (submitting the form)
                      event.preventDefault();
                      // Get the trimmed value of the input element
                      const tagContent = (event.target as HTMLInputElement).value.trim();

                      // If the trimmed value is not an empty string
                      if (tagContent !== '') {
                          props.onTagAdded(tagContent); // Call the onTagAdded function passed as a prop
                          //(event.target as HTMLInputElement).value = '';
                          setCurInputText('');
                      }
                  }
              }}
          />
          { props.custAfterUIElement }
      </div>
  );
}