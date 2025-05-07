import { Dispatch, SetStateAction, useRef, useState } from "react";


export interface ITagProps<T> {
    tags: T[];
    displayTags?: (tag: T) => string;
    onTagAdded: (tag: string) => void;
    onTagRemoved: (tag: T) => void;
    
    custInputUIElement?: React.JSX.Element;    
}
export function TagsInput<T>(props: ITagProps<T>) {
    const tagsUl = useRef<HTMLUListElement>(null);
    const [curInputText, setCurInputText] = useState('');    
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
          { props.custInputUIElement ?? <input type="text"
              placeholder="Enter tag name"
              value={curInputText}
              onChange={e => {
                  setCurInputText(e.target.value);
              }}
              onKeyDown={function (event) {
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
          }
      </div>
  );
}